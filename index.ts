/**
 * Cloudflare Worker for Feedback Analysis
 * Handles POST requests, analyzes feedback using Workers AI, and stores in D1 Database
 */

interface Env {
	DB: IDBDatabase;
	AI: any; // Workers AI binding
}

interface FeedbackRequest {
	feedback: string;
}

interface AIResponse {
	summary: string;
	sentiment: "Positive" | "Negative" | "Neutral";
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Only handle POST requests
		if (request.method !== "POST") {
			return new Response(JSON.stringify({ error: "Method not allowed" }), {
				status: 405,
				headers: { "Content-Type": "application/json" },
			});
		}

		try {
			// Parse JSON body
			const body: FeedbackRequest = await request.json();
			
			if (!body.feedback || typeof body.feedback !== "string") {
				return new Response(
					JSON.stringify({ error: "Missing or invalid 'feedback' field" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Analyze feedback using Workers AI
			let aiResponse: AIResponse;
			try {
				const aiPrompt = `Analyze the following feedback and return a JSON object with two fields: "summary" (a short summary in 1-2 sentences) and "sentiment" (one of: "Positive", "Negative", or "Neutral").

Feedback: ${body.feedback}

Return only valid JSON in this exact format:
{
  "summary": "your summary here",
  "sentiment": "Positive|Negative|Neutral"
}`;

				const aiResult = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
					messages: [
						{
							role: "user",
							content: aiPrompt,
						},
					],
					max_tokens: 200,
				});

				// Parse AI response - extract JSON from the response
				const aiText = aiResult.response || JSON.stringify(aiResult);
				
				// Try to extract JSON from the response
				let jsonMatch = aiText.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					throw new Error("AI did not return valid JSON");
				}

				aiResponse = JSON.parse(jsonMatch[0]) as AIResponse;

				// Validate sentiment
				if (!["Positive", "Negative", "Neutral"].includes(aiResponse.sentiment)) {
					aiResponse.sentiment = "Neutral";
				}

				// Ensure summary exists
				if (!aiResponse.summary) {
					aiResponse.summary = "No summary available";
				}
			} catch (aiError) {
				console.error("AI Analysis Error:", aiError);
				return new Response(
					JSON.stringify({
						error: "Failed to analyze feedback",
						details: aiError instanceof Error ? aiError.message : "Unknown error",
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Insert into D1 Database
			try {
				const result = await env.DB.prepare(
					"INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES (?, ?, ?, ?)"
				)
					.bind(
						body.feedback,
						aiResponse.sentiment,
						aiResponse.summary,
						new Date().toISOString()
					)
					.run();

				return new Response(
					JSON.stringify({
						success: true,
						message: "Feedback saved successfully",
						id: result.meta.last_row_id,
						data: {
							feedback: body.feedback,
							sentiment: aiResponse.sentiment,
							summary: aiResponse.summary,
						},
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			} catch (dbError) {
				console.error("Database Error:", dbError);
				return new Response(
					JSON.stringify({
						error: "Failed to save feedback to database",
						details: dbError instanceof Error ? dbError.message : "Unknown error",
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					}
				);
			}
		} catch (error) {
			console.error("Request Processing Error:", error);
			return new Response(
				JSON.stringify({
					error: "Failed to process request",
					details: error instanceof Error ? error.message : "Unknown error",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	},
};
