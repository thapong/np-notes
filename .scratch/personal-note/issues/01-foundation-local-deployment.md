# 01: Foundation & Local Deployment

**What to build:** A reproducible local environment that starts the application and PostgreSQL with pgvector, validates configuration, and provides a working test command.

**Blocked by:** None (can start immediately)

**Status:** completed

- [ ] Docker Compose starts PostgreSQL with the `vector` extension and persistent data storage.
- [ ] The application and database have health checks and clear startup dependencies.
- [ ] Configuration validates database, LINE, storage, AI provider, model, worker interval, and attachment-size settings without exposing secrets.
- [ ] Vitest is configured for TypeScript unit tests and a sample configuration test passes.
- [ ] The default configuration selects Ollama with `embeddinggemma`; OpenRouter requires an API key.
- [ ] `docker compose config`, `npm run lint`, `npm run build`, and the focused test command pass.
