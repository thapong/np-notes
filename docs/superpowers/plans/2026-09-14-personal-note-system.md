# Personal Note System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user personal Note application with a Dashboard, responsive Slide Menu, LINE Webhook ingestion, PostgreSQL + pgvector search, Docker Compose deployment, and selectable Ollama/OpenRouter embeddings.

**Architecture:** Keep the existing Next.js App Router application as the web/API layer. Add a PostgreSQL database with pgvector, a separate worker process for asynchronous LINE event processing, local attachment storage, and an embedding-provider interface that supports Ollama and OpenRouter without coupling search code to either provider.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, TypeScript 5, PostgreSQL with pgvector, Docker Compose, LINE Messaging API Webhook, Ollama `/api/embed`, OpenRouter `/api/v1/embeddings`, and the existing Tailwind/PostCSS setup.

**Spec:** `docs/superpowers/specs/2026-09-14-note-system-design.md`

## Global Constraints

- The first release is single-user and has no account or permission system.
- The deployment target is a personal computer or private server managed with Docker Compose.
- The first release must support LINE text, image, video, audio, file, location, and sticker message events.
- LINE signatures must be validated before an event is persisted.
- Duplicate LINE event IDs must be idempotent.
- A Note must still be saved when embedding generation is unavailable.
- `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, and `OPENROUTER_API_KEY` must remain environment variables and must not be stored in PostgreSQL.
- File paths must be generated under one controlled storage root; user input must never choose an arbitrary path.
- Changing the embedding provider or model creates a new embedding profile and requires re-indexing; Note content must remain unchanged.
- The application must provide keyword search even when no AI provider is configured.
- UI must include a Dashboard and an open/close responsive Slide Menu with active navigation state.

---

## File and Module Map

Create focused modules instead of placing database, LINE, AI, and UI logic in `app/page.tsx`.

- `docker-compose.yml`: local production-like service topology.
- `Dockerfile`: reproducible Next.js app/worker image.
- `.env.example`: documented non-secret configuration names and safe example values.
- `db/init/001_extensions.sql`: enables `vector` and required database extensions.
- `db/migrations/001_initial_schema.sql`: categories, notes, attachments, webhook events, embedding profiles, and note embeddings.
- `src/server/db.ts`: PostgreSQL pool and transaction helpers.
- `src/server/config.ts`: typed environment configuration and validation.
- `src/server/notes/types.ts`: domain types shared by server modules.
- `src/server/notes/category-parser.ts`: `#category` parsing and uncategorized fallback.
- `src/server/notes/repository.ts`: Note/category/attachment persistence.
- `src/server/webhook/line-signature.ts`: LINE HMAC signature verification.
- `src/server/webhook/line-events.ts`: event normalization and idempotency helpers.
- `src/server/ai/provider.ts`: `EmbeddingProvider` interface and profile types.
- `src/server/ai/ollama-provider.ts`: local Ollama adapter.
- `src/server/ai/openrouter-provider.ts`: OpenRouter adapter.
- `src/server/ai/provider-factory.ts`: provider selection and health checks.
- `src/server/search/search-service.ts`: hybrid keyword/vector query and ranking.
- `src/worker/index.ts`: worker loop and retry transitions.
- `src/worker/process-webhook-event.ts`: one-event processing boundary.
- `app/api/line/webhook/route.ts`: LINE webhook endpoint.
- `app/api/notes/route.ts`: Note list/create/search API.
- `app/api/notes/[id]/route.ts`: Note detail/update API.
- `app/api/categories/route.ts`: category CRUD API.
- `app/api/webhook-events/route.ts`: event status and retry API.
- `app/api/settings/ai/route.ts`: AI provider status, test, and re-index commands.
- `app/layout.tsx`: application shell and global navigation state.
- `app/page.tsx`: Dashboard screen.
- `app/notes/page.tsx`: Notes list and search screen.
- `app/notes/[id]/page.tsx`: Note detail screen.
- `app/categories/page.tsx`: Category management screen.
- `app/webhook-events/page.tsx`: Webhook status/retry screen.
- `app/settings/page.tsx`: AI settings screen.
- `components/layout/slide-menu.tsx`: responsive Slide Menu.
- `components/notes/*`: Note list, search controls, detail, and attachment views.
- `components/categories/*`: category controls.
- `components/settings/*`: provider settings and re-index controls.
- `tests/unit/*`: pure parser, signature, provider, and ranking tests.
- `tests/integration/*`: database and API tests.
- `tests/fixtures/line-events/*`: representative LINE webhook payloads.

## Implementation Tasks

### Task 1: Establish project configuration and test foundation

**Files:**
- Create: `src/server/config.ts`
- Create: `tests/unit/config.test.ts`
- Create: `.env.example`
- Modify: `package.json`
- Modify: `tsconfig.json`

**Interfaces:**
- Produces `AppConfig` with database URL, LINE credentials, storage root, AI provider, AI model, worker interval, and file limits.

- [ ] **Step 1: Add the test command and server-side test entry point.**

Add a test script that can run TypeScript unit tests using the project’s installed tooling. Keep the existing `dev`, `build`, and `lint` scripts unchanged.

- [ ] **Step 2: Write configuration tests.**

Test that missing required database configuration fails with a named error, that `AI_PROVIDER=ollama` accepts an empty OpenRouter key, and that `AI_PROVIDER=openrouter` requires `OPENROUTER_API_KEY`.

- [ ] **Step 3: Implement typed configuration loading.**

Expose:

```ts
export type AiProviderName = "ollama" | "openrouter";

export type AppConfig = {
  databaseUrl: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  storageRoot: string;
  aiProvider: AiProviderName;
  aiEmbeddingModel: string;
  openRouterApiKey?: string;
  workerIntervalMs: number;
  maxAttachmentBytes: number;
};

export function loadConfig(env?: NodeJS.ProcessEnv): AppConfig;
```

Validate enum values and numeric limits at startup, and never include secret values in thrown error messages.

- [ ] **Step 4: Run the focused test and lint.**

Run `npm test -- --runInBand tests/unit/config.test.ts` and `npm run lint`. Expected: PASS with no lint errors.

### Task 2: Add Docker Compose and PostgreSQL schema

**Files:**
- Create: `docker-compose.yml`
- Create: `Dockerfile`
- Create: `db/init/001_extensions.sql`
- Create: `db/migrations/001_initial_schema.sql`
- Create: `tests/integration/schema.test.ts`

**Interfaces:**
- Produces PostgreSQL tables and indexes consumed by repositories and the worker.

- [ ] **Step 1: Write schema verification tests.**

Add an integration test that connects using `DATABASE_URL`, verifies the `vector` extension, inserts a category and Note, and verifies the unique constraints for `line_event_id` and `line_message_id`.

- [ ] **Step 2: Define the database schema.**

Create the tables from the design spec. Use UUID primary keys, UTC timestamps, JSONB for raw payload/location data, status checks for webhook events, and a maintained `tsvector` search column on `notes`. Create indexes for category/date filters, webhook status, and full-text search.

For vector storage, create `embedding_profiles` and a `note_embeddings` table with a fixed vector dimension for the active model. The implementation must reject writes whose vector length differs from the profile dimension.

- [ ] **Step 3: Define Compose services.**

Add `postgres` with a pgvector image, persistent database volume, health check, and initialization mounts. Add `app` and `worker` from the same image. Add `ollama` behind an optional Compose profile and persistent model volume. Do not put secret values directly in the Compose file.

- [ ] **Step 4: Build the image and run schema tests.**

Run `docker compose config`, `docker compose build`, and the integration test against the started database. Expected: valid Compose configuration, successful image build, and passing schema constraints.

### Task 3: Implement database access and Note repositories

**Files:**
- Create: `src/server/db.ts`
- Create: `src/server/notes/types.ts`
- Create: `src/server/notes/repository.ts`
- Create: `src/server/categories/repository.ts`
- Create: `tests/unit/notes-repository.test.ts`
- Create: `tests/integration/repositories.test.ts`

**Interfaces:**
- Consumes the schema from Task 2.
- Produces `NoteRepository`, `CategoryRepository`, and typed records for API and worker modules.

Required repository methods:

```ts
createNote(input: CreateNoteInput): Promise<NoteRecord>;
updateNote(id: string, input: UpdateNoteInput): Promise<NoteRecord>;
getNote(id: string): Promise<NoteRecord | null>;
listNotes(filters: NoteFilters): Promise<PaginatedNotes>;
createAttachment(input: CreateAttachmentInput): Promise<AttachmentRecord>;
getOrCreateCategory(name: string): Promise<CategoryRecord>;
updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryRecord>;
```

- [ ] **Step 1: Write repository tests for Note and category behavior.**

Cover creation with an uncategorized Note, category assignment, attachment metadata, pagination, and update behavior. Add a test that Note text updates the full-text search document.

- [ ] **Step 2: Implement the pool and transaction helper.**

Create a single PostgreSQL pool per process, expose `withTransaction`, set a bounded connection timeout, and release clients in `finally` blocks.

- [ ] **Step 3: Implement repository methods with parameterized SQL.**

Keep SQL inside repository modules. Never interpolate user input into SQL identifiers or clauses. Use transactions when creating a Note and its attachments together.

- [ ] **Step 4: Run repository tests and lint.**

Run `npm test -- --runInBand tests/unit/notes-repository.test.ts tests/integration/repositories.test.ts` and `npm run lint`. Expected: PASS.

### Task 4: Implement category parsing and LINE signature verification

**Files:**
- Create: `src/server/notes/category-parser.ts`
- Create: `src/server/webhook/line-signature.ts`
- Create: `src/server/webhook/line-events.ts`
- Create: `tests/unit/category-parser.test.ts`
- Create: `tests/unit/line-signature.test.ts`
- Create: `tests/unit/line-events.test.ts`

**Interfaces:**
- Produces:

```ts
export function parseCategory(text: string): {
  categoryName: string | null;
  searchableText: string;
};

export function verifyLineSignature(
  rawBody: string,
  signature: string,
  channelSecret: string,
): boolean;

export function normalizeLineEvent(payload: unknown): NormalizedLineEvent;
```

- [ ] **Step 1: Write parser and signature tests.**

Cover `#งาน โทรหาลูกค้า`, text without a hashtag, multiple hashtags where the first token is the category, malformed markers, valid HMAC signatures, invalid signatures, and changed-body rejection.

- [ ] **Step 2: Implement category parsing.**

Trim the first hashtag token, preserve the remaining text, reject empty category names, and return `categoryName: null` when no valid marker exists.

- [ ] **Step 3: Implement constant-time LINE signature verification.**

Compute Base64 HMAC-SHA256 over the exact raw request body and compare with `crypto.timingSafeEqual`, returning `false` for missing or malformed inputs.

- [ ] **Step 4: Implement event normalization.**

Map LINE text, image, video, audio, file, location, sticker, follow, unfollow, join, leave, member join/leave, postback, beacon, and account-link events into a discriminated internal type. Preserve the original event payload.

- [ ] **Step 5: Run focused tests.**

Run `npm test -- --runInBand tests/unit/category-parser.test.ts tests/unit/line-signature.test.ts tests/unit/line-events.test.ts`. Expected: PASS.

### Task 5: Add LINE Webhook persistence and idempotency

**Files:**
- Create: `app/api/line/webhook/route.ts`
- Create: `src/server/webhook/event-repository.ts`
- Create: `tests/integration/line-webhook-route.test.ts`
- Create: `tests/fixtures/line-events/*.json`

**Interfaces:**
- Consumes signature verification and event normalization from Task 4.
- Produces `POST /api/line/webhook` and event claiming methods for the worker.

Required event repository methods:

```ts
persistWebhookEvents(events: NormalizedLineEvent[]): Promise<PersistResult>;
claimPendingEvents(limit: number): Promise<WebhookEventRecord[]>;
markEventCompleted(id: string): Promise<void>;
markEventFailed(id: string, error: string, retryable: boolean): Promise<void>;
```

- [ ] **Step 1: Write route tests.**

Test invalid signature returns 401 and does not insert, valid payload returns 200, duplicate event IDs do not create duplicates, and malformed JSON returns 400.

- [ ] **Step 2: Implement event persistence.**

Use `INSERT ... ON CONFLICT` for idempotency. Store raw JSONB and set `pending` status. Add an atomic claim query using row locking so multiple worker instances cannot process the same event simultaneously.

- [ ] **Step 3: Implement the route.**

Read the raw body before parsing, validate `x-line-signature`, normalize and persist events, then return quickly. Never call an AI provider or download content in the request handler.

- [ ] **Step 4: Run API tests.**

Run `npm test -- --runInBand tests/integration/line-webhook-route.test.ts`. Expected: PASS.

### Task 6: Implement local attachment storage and LINE content retrieval

**Files:**
- Create: `src/server/storage/file-store.ts`
- Create: `src/server/line/content-client.ts`
- Create: `tests/unit/file-store.test.ts`
- Create: `tests/unit/content-client.test.ts`

**Interfaces:**

```ts
export interface FileStore {
  save(input: { stream: NodeJS.ReadableStream; filename: string; mimeType: string }): Promise<StoredFile>;
  remove(storagePath: string): Promise<void>;
}

export interface LineContentClient {
  download(messageId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType?: string }>;
}
```

- [ ] **Step 1: Write storage safety tests.**

Test generated paths stay below the configured root, path traversal names are neutralized, byte limits reject oversized content, and SHA-256 is calculated while saving.

- [ ] **Step 2: Implement bounded local storage.**

Generate a UUID-based path grouped by date, preserve only a sanitized display filename, stream to disk, enforce `maxAttachmentBytes`, and return path, size, MIME type, and SHA-256.

- [ ] **Step 3: Implement LINE content download.**

Call the LINE content endpoint with the channel access token, enforce response size and status handling, and return a stream without buffering the entire file in memory.

- [ ] **Step 4: Run focused tests.**

Run `npm test -- --runInBand tests/unit/file-store.test.ts tests/unit/content-client.test.ts`. Expected: PASS.

### Task 7: Implement Ollama/OpenRouter embedding providers

**Files:**
- Create: `src/server/ai/provider.ts`
- Create: `src/server/ai/ollama-provider.ts`
- Create: `src/server/ai/openrouter-provider.ts`
- Create: `src/server/ai/provider-factory.ts`
- Create: `tests/unit/embedding-providers.test.ts`

**Interfaces:**

```ts
export type EmbeddingResult = { vectors: number[][]; model: string; dimension: number };

export interface EmbeddingProvider {
  embedOne(text: string): Promise<number[]>;
  embedMany(texts: string[]): Promise<number[][]>;
  getModelInfo(): { provider: AiProviderName; model: string };
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
}

export function createEmbeddingProvider(config: AppConfig): EmbeddingProvider;
```

- [ ] **Step 1: Write mocked HTTP tests.**

Test Ollama request shape `{ model, input }` against `/api/embed`, OpenRouter bearer authentication and request shape against `/api/v1/embeddings`, response dimension detection, provider selection, missing OpenRouter key rejection, timeout, and non-2xx errors.

- [ ] **Step 2: Implement the shared provider contract.**

Normalize both response formats to `number[][]`, reject empty vectors and inconsistent batch dimensions, and expose model information without exposing API keys.

- [ ] **Step 3: Implement Ollama adapter.**

Use the configured base URL and model. Support one or many texts with the documented `input` field and enforce request timeout.

- [ ] **Step 4: Implement OpenRouter adapter.**

Use `Authorization: Bearer`, configured model, optional dimensions, and a bounded timeout. Keep the adapter compatible with the embeddings endpoint rather than chat completion.

- [ ] **Step 5: Run provider tests.**

Run `npm test -- --runInBand tests/unit/embedding-providers.test.ts`. Expected: PASS.

### Task 8: Implement the asynchronous worker and Note creation

**Files:**
- Create: `src/worker/process-webhook-event.ts`
- Create: `src/worker/index.ts`
- Create: `tests/unit/process-webhook-event.test.ts`
- Create: `tests/integration/worker.test.ts`

**Interfaces:**
- Consumes event claiming from Task 5, storage from Task 6, repositories from Task 3, and embeddings from Task 7.
- Produces a repeatable `processWebhookEvent(eventId: string): Promise<ProcessResult>` boundary.

- [ ] **Step 1: Write processing tests.**

Cover text Note creation with category parsing, binary attachment creation, location payload storage, sticker metadata storage, AI failure still completing Note creation, and retryable download failures.

- [ ] **Step 2: Implement one-event processing.**

Run one transaction for Note metadata and attachment metadata. Download binary content before finalizing the attachment record. Use the first hashtag category, create missing categories, and save raw event references.

- [ ] **Step 3: Implement embedding persistence.**

Build searchable text from Note text plus relevant metadata, create or reuse the active embedding profile, store the vector with its source hash, and mark embedding failure separately from Note failure.

- [ ] **Step 4: Implement the worker loop.**

Poll pending events at `WORKER_INTERVAL_MS`, claim a bounded batch, process each event, mark completion/failure, and use exponential retry limits with a terminal failed state.

- [ ] **Step 5: Run worker tests.**

Run `npm test -- --runInBand tests/unit/process-webhook-event.test.ts tests/integration/worker.test.ts`. Expected: PASS.

### Task 9: Implement hybrid keyword and vector search

**Files:**
- Create: `src/server/search/search-service.ts`
- Create: `tests/unit/search-service.test.ts`
- Create: `tests/integration/search.test.ts`

**Interfaces:**

```ts
export type SearchFilters = {
  query: string;
  categoryId?: string;
  contentType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export function searchNotes(filters: SearchFilters): Promise<PaginatedSearchResults>;
```

- [ ] **Step 1: Write ranking tests.**

Test keyword-only results when no provider is available, semantic-only results when full-text has no hit, combined ranking, category/date/type filters, pagination, and empty queries.

- [ ] **Step 2: Implement keyword search.**

Use PostgreSQL full-text operators and `ts_rank_cd` against `search_document`. Parameterize query and filters.

- [ ] **Step 3: Implement semantic search.**

Generate a query embedding through the active provider and use cosine distance against the matching embedding profile. If generation fails, continue with keyword search.

- [ ] **Step 4: Combine scores.**

Normalize both scores, combine them with a documented deterministic weight, and return score components for debugging without exposing raw vectors.

- [ ] **Step 5: Run search tests.**

Run `npm test -- --runInBand tests/unit/search-service.test.ts tests/integration/search.test.ts`. Expected: PASS.

### Task 10: Add server APIs for Notes, categories, events, settings, and re-indexing

**Files:**
- Create: `app/api/notes/route.ts`
- Create: `app/api/notes/[id]/route.ts`
- Create: `app/api/categories/route.ts`
- Create: `app/api/webhook-events/route.ts`
- Create: `app/api/settings/ai/route.ts`
- Create: `src/server/reindex/reindex-service.ts`
- Create: `tests/integration/app-api.test.ts`

**Interfaces:**
- Produces JSON APIs for all UI pages and actions.

- [ ] **Step 1: Write API contract tests.**

Cover Note list/search, Note update, category create/update, failed event list/retry, AI health check, provider setting validation, and re-index scope selection.

- [ ] **Step 2: Implement Note routes.**

Use strict request schemas, return 400 for invalid input, 404 for missing records, and preserve attachment metadata during Note edits.

- [ ] **Step 3: Implement category and event routes.**

Expose category management and a retry action that moves a failed event back to `pending` without duplicating Note data.

- [ ] **Step 4: Implement AI settings and re-index service.**

Allow selecting the provider/model in process configuration, report health status, create a new embedding profile when dimensions change, and enqueue missing/stale Notes for re-indexing.

- [ ] **Step 5: Run API tests and build.**

Run `npm test -- --runInBand tests/integration/app-api.test.ts`, `npm run lint`, and `npm run build`. Expected: PASS.

### Task 11: Build the Dashboard and responsive Slide Menu UI

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Create: `components/layout/slide-menu.tsx`
- Create: `components/layout/app-shell.tsx`
- Create: `components/dashboard/dashboard-cards.tsx`
- Create: `components/dashboard/recent-notes.tsx`
- Create: `app/notes/page.tsx`
- Create: `app/notes/[id]/page.tsx`
- Create: `app/categories/page.tsx`
- Create: `app/webhook-events/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `tests/ui/navigation.test.tsx`

**Interfaces:**
- Consumes the APIs from Task 10.
- Produces the Dashboard route `/`, responsive navigation, and all first-release screens.

- [ ] **Step 1: Write navigation tests.**

Test menu links, active route state, open/close behavior, keyboard close behavior, and mobile drawer overlay behavior.

- [ ] **Step 2: Implement the application shell.**

Create a client-side navigation state for the Slide Menu. Desktop uses a collapsible side rail; small screens use a drawer with overlay. Keep navigation labels: Dashboard, Notes, Categories, Webhook Events, Settings.

- [ ] **Step 3: Implement the Dashboard.**

Show recent Notes, category counts, failed/pending Webhook counts, and a prominent search entry point. Use loading, empty, and error states for each data block.

- [ ] **Step 4: Implement Notes and detail views.**

Provide search, filters, pagination, category edit, attachment previews/download links, and Note metadata. Keep keyword/semantic search mode visible in the results UI.

- [ ] **Step 5: Implement Categories, Webhook Events, and Settings pages.**

Add category CRUD, event retry/details, provider/model health check, OpenRouter privacy warning, and re-index action with progress feedback.

- [ ] **Step 6: Run UI tests and lint.**

Run `npm test -- --runInBand tests/ui/navigation.test.tsx`, `npm run lint`, and `npm run build`. Expected: PASS.

### Task 12: Add deployment documentation and end-to-end verification

**Files:**
- Create: `README.md` sections for deployment, LINE setup, provider selection, backup, and troubleshooting
- Create: `docs/operations/backup-and-restore.md`
- Create: `tests/e2e/line-to-search.test.ts`
- Modify: `docker-compose.yml` if verification reveals health or dependency issues

**Interfaces:**
- Consumes all application services from Tasks 1-11.
- Produces a repeatable local deployment and verification procedure.

- [ ] **Step 1: Write the end-to-end test fixture.**

Use a signed LINE webhook fixture containing a text message with `#งาน`, run the worker, query the Notes API, and verify the Note is searchable by both the exact phrase and a semantic query when an embedding provider is available.

- [ ] **Step 2: Document setup.**

Document copying `.env.example`, starting Compose, enabling the Ollama profile or configuring OpenRouter, setting the LINE webhook URL, and checking the Webhook Events page.

- [ ] **Step 3: Document backup and restore.**

Document PostgreSQL dump/restore and separate local attachment backup/restore. State that both are required for a complete recovery.

- [ ] **Step 4: Run the full verification loop.**

Run `docker compose config`, `docker compose build`, `npm run lint`, `npm run build`, the complete test suite, and the browser smoke test for Dashboard, Slide Menu, search, attachment display, Webhook retry, and AI Settings.

- [ ] **Step 5: Record known limitations.**

Record the selected initial embedding models, worker retry limit, file-size limit, and whether the deployment uses Ollama or OpenRouter. Do not claim semantic search is available if no embedding provider has passed its health check.

## Completion Checklist

- [ ] Design spec requirements are covered by Tasks 1-12.
- [ ] `docker compose config` succeeds.
- [ ] PostgreSQL starts with `vector` enabled.
- [ ] LINE signature and duplicate-event tests pass.
- [ ] All supported message types produce a Note or auditable webhook event.
- [ ] Note creation succeeds when AI is unavailable.
- [ ] Ollama and OpenRouter provider tests pass with mocked HTTP.
- [ ] Keyword and semantic search tests pass.
- [ ] Dashboard and Slide Menu are verified at desktop and mobile widths.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] Backup/restore instructions are complete.
