#!/bin/bash
# Test script for Workers AI feedback analysis
# Make sure to run: wrangler dev (or uv run pywrangler dev) first

echo "Testing Workers AI Feedback Analysis..."
echo ""

# Check if worker is running
if ! curl -s --max-time 2 http://localhost:8787 > /dev/null 2>&1; then
	echo "Error: Worker not running on http://localhost:8787"
	echo "Please start the worker first with: uv run pywrangler dev"
	exit 1
fi

# Test 1: Positive feedback
echo "Test 1: Positive feedback"
curl -X POST http://localhost:8787 \
  --max-time 60 \
  -H "Content-Type: application/json" \
  -d '{"feedback": "The product arrived exactly on time and the quality exceeded my expectations! The packaging was excellent."}' \
  2>/dev/null | jq '.' || echo "Request failed or timed out"

echo ""
echo "---"
echo ""

# Test 2: Negative feedback
echo "Test 2: Negative feedback"
curl -X POST http://localhost:8787 \
  --max-time 60 \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Very disappointed with my purchase. The item description was misleading and delivery was delayed by over a week."}' \
  2>/dev/null | jq '.' || echo "Request failed or timed out"

echo ""
echo "---"
echo ""

# Test 3: Neutral feedback
echo "Test 3: Neutral feedback"
curl -X POST http://localhost:8787 \
  --max-time 60 \
  -H "Content-Type: application/json" \
  -d '{"feedback": "The service is okay, nothing special but it gets the job done. The pricing is reasonable."}' \
  2>/dev/null | jq '.' || echo "Request failed or timed out"

echo ""
echo "Done! Check the responses above to verify AI analysis worked."
