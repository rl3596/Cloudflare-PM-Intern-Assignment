"""
Cloudflare Worker for Feedback Analysis
Handles POST requests, analyzes feedback using Workers AI, and stores in D1 Database
"""

from workers import Response, WorkerEntrypoint  # type: ignore
import json
import re
from datetime import datetime

class Default(WorkerEntrypoint):
	async def fetch(self, request):
		# Access env bindings via self.env
		env = self.env
		
		# Check if env bindings are available
		if env is None:
			return Response.json(
				{
					"error": "Environment bindings not available",
					"details": "Make sure to run with 'wrangler dev' or ensure bindings are configured correctly"
				},
				status=500
			)
		
		if not hasattr(env, 'AI') or env.AI is None:
			return Response.json(
				{
					"error": "AI binding not available",
					"details": "Make sure AI binding is configured in wrangler.jsonc and run with 'wrangler dev'"
				},
				status=500
			)
		
		if not hasattr(env, 'DB') or env.DB is None:
			return Response.json(
				{
					"error": "DB binding not available",
					"details": "Make sure D1 database binding is configured in wrangler.jsonc"
				},
				status=500
			)
		
		# Only handle POST requests
		if request.method != "POST":
			return Response.json({"error": "Method not allowed"}, status=405)

		try:
			# Parse JSON body
			body = await request.json()
			
			if not body.get("feedback") or not isinstance(body.get("feedback"), str):
				return Response.json(
					{"error": "Missing or invalid 'feedback' field"},
					status=400
				)

			feedback_text = body["feedback"]

			# Analyze feedback using Workers AI
			try:
				ai_prompt = f"""Analyze the following feedback and return a JSON object with two fields: "summary" (a short summary in 1-2 sentences) and "sentiment" (one of: "Positive", "Negative", or "Neutral").

Feedback: {feedback_text}

Return only valid JSON in this exact format:
{{
  "summary": "your summary here",
  "sentiment": "Positive|Negative|Neutral"
}}"""

				# Try prompt format first (simpler format)
				ai_result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
					"prompt": ai_prompt
				})

				# Parse AI response - extract JSON from the response
				ai_text = ai_result.get("response") or str(ai_result)
				
				# Try to extract JSON from the response
				json_match = re.search(r"\{[\s\S]*\}", ai_text)
				if not json_match:
					raise Exception("AI did not return valid JSON")

				ai_response = json.loads(json_match.group(0))

				# Validate sentiment
				if ai_response.get("sentiment") not in ["Positive", "Negative", "Neutral"]:
					ai_response["sentiment"] = "Neutral"

				# Ensure summary exists
				if not ai_response.get("summary"):
					ai_response["summary"] = "No summary available"

			except Exception as ai_error:
				print(f"AI Analysis Error: {ai_error}")
				return Response.json(
					{
						"error": "Failed to analyze feedback",
						"details": str(ai_error),
					},
					status=500
				)

			# Insert into D1 Database
			try:
				created_at = datetime.utcnow().isoformat() + "Z"
				
				result = await env.DB.prepare(
					"INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES (?, ?, ?, ?)"
				).bind(
					feedback_text,
					ai_response["sentiment"],
					ai_response["summary"],
					created_at
				).run()

				return Response.json(
					{
						"success": True,
						"message": "Feedback saved successfully",
						"id": result.last_insert_rowid,
						"data": {
							"feedback": feedback_text,
							"sentiment": ai_response["sentiment"],
							"summary": ai_response["summary"],
						},
					},
					status=200
				)

			except Exception as db_error:
				print(f"Database Error: {db_error}")
				return Response.json(
					{
						"error": "Failed to save feedback to database",
						"details": str(db_error),
					},
					status=500
				)

		except Exception as error:
			print(f"Request Processing Error: {error}")
			return Response.json(
				{
					"error": "Failed to process request",
					"details": str(error),
				},
				status=500
			)
