# Personal Note System Implementation Plan

> **For agentic workers:** Execute these tickets in dependency order. Each ticket is a tracer-bullet vertical slice and must be independently verifiable before the next unblocked ticket starts.

**Goal:** Build a single-user personal Note application with Dashboard, responsive Slide Menu, LINE Webhook ingestion, PostgreSQL + pgvector search, Docker Compose deployment, and selectable Ollama/OpenRouter embeddings.

**Architecture:** Next.js remains the web/API layer. PostgreSQL with pgvector stores Note data and embeddings. A database-polling worker processes LINE events asynchronously. Attachments remain on controlled local storage. An embedding-provider interface isolates Ollama and OpenRouter from search and ingestion logic.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, TypeScript 5, PostgreSQL with pgvector, Docker Compose, Vitest, LINE Messaging API Webhook, Ollama embeddings, and OpenRouter embeddings.

**Spec:** `docs/superpowers/specs/2026-09-14-note-system-design.md`

## Decisions locked for implementation

- Single-user local application; no accounts or permissions in the first release.
- Test runner: Vitest with TypeScript and React Testing Library where UI tests need it.
- Worker scheduling: PostgreSQL polling with row locking; no separate queue in the first release.
- Local embedding default: Ollama with `embeddinggemma`; model remains configurable.
- Remote embedding: OpenRouter model remains configurable through environment variables.
- Default maximum attachment size: 50 MB.
- Storage root: `./storage`, configurable through environment variables.
- Raw Webhook payloads are retained for troubleshooting and can be retried from the UI.
- Embeddings are stored with provider/model/dimension profiles; changing profile requires re-indexing.
- Local ticket files are the source of implementation work for this plan.

## Global acceptance requirements

- LINE signatures are validated before persistence and duplicate event IDs are idempotent.
- Text, image, video, audio, file, location, and sticker events are represented as a Note or auditable Webhook event.
- Note creation succeeds when AI is unavailable; keyword search remains available.
- OpenRouter secrets never enter source control or PostgreSQL.
- Files are stored below one controlled storage root with size and MIME validation.
- Dashboard and responsive Slide Menu are verified at desktop and mobile widths.
- `npm run lint`, `npm run build`, unit tests, integration tests, and end-to-end smoke tests pass before release.

## Ticket sequence

1. Foundation & Local Deployment — no blockers
2. Manual Note & Keyword Search — blocked by 1
3. LINE Text to Note — blocked by 1 and 2
4. LINE Attachments — blocked by 3
5. AI Provider & Semantic Search — blocked by 2 and 3
6. Webhook Reliability & Re-indexing — blocked by 3, 4, and 5
7. Dashboard, Slide Menu & Management UI — blocked by 2, 3, 4, and 6
8. Deployment, Backup & End-to-End Verification — blocked by 1–7

## Definition of done for every ticket

- Acceptance criteria are demonstrated with automated tests where practical.
- The ticket's happy path and failure path are verified.
- Existing lint/build checks remain green.
- Configuration and privacy implications are documented.
- The corresponding local ticket file is checked off only after verification.
