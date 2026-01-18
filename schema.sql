-- Feedback Table Schema for Cloudflare D1 Database
-- Run this with: wrangler d1 execute feedback-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS Feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
