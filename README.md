# NP Note

Personal Note workspace for one user. It accepts LINE Webhook events, stores Notes and attachments locally, and supports keyword and semantic search.

## Run locally

1. Copy `.env.example` to `.env` and fill in the LINE credentials.
2. Start the database and application with `docker compose up --build`.
3. Open `http://localhost:3000`.

Use `AI_PROVIDER=ollama` for local embeddings. Use `AI_PROVIDER=openrouter` with `OPENROUTER_API_KEY` for remote embeddings. If the AI provider is unavailable, Notes and keyword search continue to work.

The LINE Webhook endpoint is `POST /api/line/webhook`. It requires a publicly reachable HTTPS URL, for example through a private tunnel.

## Verification

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
docker compose config
```

## Backup

Back up PostgreSQL and the local attachment volume separately. A database dump without the attachment directory cannot restore a complete Note.
