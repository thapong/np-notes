# NP Note

Personal Note workspace for one user. It accepts LINE Webhook events, stores Notes and attachments locally, and supports keyword and semantic search.

## Run locally

1. Copy `.env.example` to `.env` and fill in the LINE credentials.
2. Start the database, application and worker with `docker compose up --build`.
3. For local Ollama, start its optional profile with `docker compose --profile ollama up -d ollama` and pull the configured embedding model.
4. Open `http://localhost:3300` when using the repository `.env` defaults.

Use `AI_PROVIDER=ollama` for local embeddings. Use `AI_PROVIDER=openrouter` with `OPENROUTER_API_KEY` for remote embeddings. If the AI provider is unavailable, Notes and keyword search continue to work.

The LINE Webhook endpoint is `POST /api/line/webhook`. It requires a publicly reachable HTTPS URL, for example through a private tunnel.

Set `OPENROUTER_API_KEY` in `.env` when `AI_PROVIDER=openrouter`. Keep `.env` out of source control. The Settings page can health-check the selected provider and re-index Notes that do not yet have embeddings.

## Deploy with Docker

Use the production Compose bundle on a private server. It builds the Next.js app and worker from the multi-stage `Dockerfile`, keeps PostgreSQL internal to the Compose network, and persists database/attachment data in named volumes.

```powershell
Copy-Item .env.example .env
# Edit .env and set real LINE credentials and database/AI settings.
docker compose -f docker-compose.deploy.yml up -d --build
```

The application is available at `http://<server>:3300` by default. Put it behind an HTTPS reverse proxy before registering the LINE Webhook URL. To stop the deployment without deleting data:

```powershell
docker compose -f docker-compose.deploy.yml down
```

To use the optional Ollama service, add `--profile ollama` to the `up` command and pull the configured embedding model inside the Ollama container.

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

Example backup commands:

```powershell
docker compose exec -T postgres pg_dump -U np_note -d np_note -Fc > backup\np-note.dump
docker run --rm -v np-note_note_storage:/source -v ${PWD}\backup:/backup alpine tar czf /backup/attachments.tgz -C /source .
```
