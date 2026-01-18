# Cloudflare Feedback Analyzer

## Overview
This project is a prototype built for the Cloudflare Product Manager Intern assignment. It demonstrates a serverless workflow that automatically analyzes customer feedback for sentiment and summarization.

## Architecture
* **Orchestrator:** Cloudflare Workers (TypeScript)
* **Intelligence:** Workers AI (@cf/meta/llama-3-8b-instruct)
* **Storage:** D1 Database (SQL)

## Project Structure
* `src/index.ts`: Main application logic handling requests and AI inference.
* `wrangler.jsonc`: Configuration for bindings (DB, AI) and deployment settings.
* `schema.sql`: SQL schema used to initialize the D1 database table.

## Setup & Run
1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run locally:**
    ```bash
    npx wrangler dev
    ```
3.  **Deploy:**
    ```bash
    npx wrangler deploy
    ```

## API Usage
**Endpoint:** `POST /`

**Payload:**
```json
{
  "feedback": "Your documentation is comprehensive but search is slow."
}
