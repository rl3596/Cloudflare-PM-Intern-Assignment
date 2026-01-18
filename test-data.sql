-- Test data: Mock customer feedback entries
-- Run this with: wrangler d1 execute feedback-db --local --file=./test-data.sql

-- Positive feedback
INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES 
('The product arrived exactly on time and the quality exceeded my expectations! The packaging was excellent and the customer service team was very helpful when I had questions. I will definitely order again.', 'Positive', 'Customer satisfied with timely delivery, quality, and service', '2024-01-15T10:30:00Z');

INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES 
('Amazing experience! The website is so easy to navigate and checkout was seamless. I love how intuitive the interface is. This is the best online shopping experience I have had in a long time.', 'Positive', 'Customer praises website usability and checkout process', '2024-01-16T14:20:00Z');

-- Negative feedback
INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES 
('Very disappointed with my purchase. The item description was misleading and the actual product looks nothing like the photos. Delivery was also delayed by over a week. Would not recommend.', 'Negative', 'Customer unhappy with product mismatch and delayed delivery', '2024-01-17T09:15:00Z');

INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES 
('The app keeps crashing on my phone and customer support has been unresponsive. I have tried reaching out multiple times but no one gets back to me. This is extremely frustrating.', 'Negative', 'Customer reports app crashes and poor support response', '2024-01-18T16:45:00Z');

-- Neutral feedback
INSERT INTO Feedback (content, sentiment, summary, created_at) VALUES 
('The service is okay, nothing special but it gets the job done. The pricing is reasonable for what you get. I might consider using it again in the future if needed.', 'Neutral', 'Customer finds service adequate with reasonable pricing', '2024-01-19T11:30:00Z');
