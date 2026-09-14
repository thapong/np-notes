# Personal Note System Design

## Status

Approved architecture; implementation has not started.

## Goal

สร้างระบบเก็บ Note สำหรับผู้ใช้คนเดียว โดยรับข้อมูลจาก LINE Webhook, จัดหมวดหมู่ได้, ค้นหาได้ทั้งแบบคำตรงและความหมายใกล้เคียง และติดตั้งได้บนเครื่องหรือเซิร์ฟเวอร์ส่วนตัวด้วย Docker Compose

## Scope

### Included in the first release

- รับ LINE Webhook ทุก event type และบันทึก raw event สำหรับตรวจสอบย้อนหลัง
- สร้าง Note จาก message event ได้แก่ text, image, video, audio, file, location และ sticker
- จัดหมวดหมู่จาก syntax `#หมวดหมู่` ในข้อความ
- เก็บข้อมูลที่ไม่ระบุหมวดเป็น `ยังไม่จัดหมวด`
- แก้ไข Note และย้ายหมวดหมู่ผ่านหน้าเว็บ
- เก็บไฟล์แนบไว้บน local file storage ของเซิร์ฟเวอร์
- ค้นหาด้วย PostgreSQL full-text search
- ค้นหาด้วย semantic search ผ่าน pgvector
- เลือก embedding provider ระหว่าง Ollama และ OpenRouter
- มี retry และ re-index สำหรับงานที่ล้มเหลว
- รันด้วย Docker Compose

### Excluded from the first release

- ผู้ใช้หลายคนและระบบสิทธิ์
- การแชร์ Note
- การสรุป Note อัตโนมัติ
- การค้นหาหรือโต้ตอบผ่าน LINE โดยตรง

## Architecture

```text
LINE Platform
    |
    v
Next.js Webhook API ---- PostgreSQL + pgvector
    |                           |
    |                           +-- notes
    |                           +-- categories
    |                           +-- attachments
    |                           +-- webhook_events
    |                           +-- embedding_profiles
    |                           +-- note_embeddings
    v
Worker ------------------- Local file storage
    |
    +-- Ollama (local provider)
    +-- OpenRouter (remote provider)
```

### Runtime services

- `app`: Next.js web application, UI, API และ LINE webhook endpoint
- `worker`: ประมวลผล event แบบ asynchronous, ดาวน์โหลด content, สร้าง embedding และ re-index
- `postgres`: PostgreSQL พร้อม extension `vector`
- `ollama`: optional service สำหรับ local embedding
- `tunnel`: optional HTTPS ingress สำหรับกรณีเซิร์ฟเวอร์อยู่หลัง router

OpenRouter ไม่ต้องมี container เพิ่ม แต่ต้องใช้ `OPENROUTER_API_KEY` และส่งข้อความออกไปยัง API ภายนอก

## Data model

### `categories`

- `id`
- `name`
- `slug`
- `color`
- `created_at`
- `updated_at`

### `notes`

- `id`
- `category_id` nullable
- `source` (`line`, `web`)
- `content_type`
- `text_content` nullable
- `location_json` nullable
- `line_message_id` nullable, unique when present
- `captured_at`
- `created_at`
- `updated_at`
- `search_document` generated or maintained `tsvector`

### `attachments`

- `id`
- `note_id`
- `line_message_id` nullable
- `original_name` nullable
- `mime_type`
- `size_bytes`
- `storage_path`
- `sha256`
- `created_at`

### `webhook_events`

- `id`
- `line_event_id`, unique when available
- `event_type`
- `payload_json`
- `status` (`pending`, `processing`, `completed`, `failed`)
- `attempt_count`
- `last_error` nullable
- `received_at`
- `processed_at` nullable

### `embedding_profiles`

- `id`
- `provider` (`ollama`, `openrouter`)
- `model`
- `dimension`
- `is_active`
- `created_at`

### `note_embeddings`

- `id`
- `note_id`
- `embedding_profile_id`
- `embedding` as `vector(dimension)` or a profile-compatible vector strategy
- `source_text_hash`
- `created_at`

Embedding metadata is stored separately from notes so changing provider or model can be handled by creating a new profile and re-indexing without changing Note data.

## LINE ingestion flow

1. Receive the webhook request.
2. Validate the `x-line-signature` header.
3. Parse the event and reject duplicate event IDs safely.
4. Store the raw payload in `webhook_events` with `pending` status.
5. Return a successful response to LINE quickly.
6. Worker claims the pending event.
7. For message events, extract text, category syntax, location data and message metadata.
8. Download binary content from LINE when applicable and save it under a controlled storage root.
9. Create or update the Note and attachments.
10. Generate embeddings when an active AI provider is available.
11. Mark the event `completed`; otherwise mark it `failed` with retryable error details.

Non-message events remain available in `webhook_events` for auditability but do not create a Note unless the event contains note-worthy content.

## Category parsing

The first hashtag token in the text is treated as the category marker. For example:

```text
#งาน โทรติดตามใบเสนอราคา
```

The category marker is removed from the searchable Note text while the category relationship is stored separately. If the category does not exist, it is created automatically. Notes without a valid marker use the default uncategorized state.

## Search design

The search API supports:

- exact and partial term search using PostgreSQL full-text search
- semantic search using cosine distance in pgvector
- filters for category, content type and date range
- a combined ranking score from keyword relevance and vector similarity

The active embedding profile is used for new queries and new Notes. Re-indexing is required after changing the active model or provider. If the AI provider is unavailable, keyword search remains available and the Note is still saved.

## AI provider abstraction

The application exposes one internal interface for embedding generation:

```text
EmbeddingProvider
  embedOne(text)
  embedMany(texts)
  getModelInfo()
  healthCheck()
```

Ollama calls the local `/api/embed` endpoint. OpenRouter calls its embeddings API with a configured model and API key. Provider selection is configuration-driven and must not leak provider-specific details into search or webhook code.

Settings must show the active provider, model, dimension and last health-check result. API keys remain environment variables and are never stored in PostgreSQL.

## Error handling and recovery

- Invalid LINE signatures return an error without storing the event.
- Duplicate LINE event IDs are treated as idempotent success.
- Download failures preserve the event and retry metadata.
- AI failures do not block Note creation.
- A failed event can be retried from the UI or by the worker.
- Re-indexing can target all Notes, one category or only Notes missing an embedding.
- File paths are generated by the application and never accepted directly from user input.
- File size and MIME type limits are enforced before storage.

## Security and privacy

- Verify LINE signatures using the channel secret.
- Keep `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` and `OPENROUTER_API_KEY` outside the repository.
- Restrict stored files to the application storage root.
- Do not expose raw webhook payloads or attachments without the local application access control boundary.
- Clearly indicate when OpenRouter is active because Note text is sent to an external service.
- Provide database and file-storage backup procedures as part of deployment documentation.

## UI outline

### Application shell

- `Dashboard` เป็นหน้าหลักหลังเปิดระบบ
- `Slide Menu` เป็นเมนูนำทางหลักแบบเปิด/ปิดได้ โดยแสดงไอคอนและชื่อเมนูเมื่อเปิดเต็มรูปแบบ
- บนหน้าจอขนาดเล็ก Slide Menu เปิดเป็น drawer ซ้อนด้านข้างและปิดได้ด้วยปุ่มหรือคลิกพื้นที่ด้านนอก
- เมนูที่เลือกอยู่ต้องมีสถานะ active ชัดเจน

### Slide Menu items

- Dashboard
- Notes
- Categories
- Webhook Events
- Settings

### Dashboard

- แสดง Note ล่าสุด
- สรุปจำนวน Note แยกตามหมวดหมู่
- แสดงจำนวน event ที่รอประมวลผลหรือ failed
- ช่องค้นหาแบบเข้าถึงได้จากหน้าแรก
- ปุ่มสร้าง Note ใหม่จากหน้าเว็บ

### Other screens

- Notes list: search, filters, pagination and category actions
- Note detail: content, attachments, source metadata and edit controls
- Category management: create, rename, color and merge
- Settings: AI provider, model, connection test and re-index action
- Webhook events: status, error details and retry action

## Verification strategy

- Unit tests for hashtag parsing, provider selection, ranking and idempotency
- API tests for LINE signature validation and webhook persistence
- Integration tests against PostgreSQL + pgvector in Docker
- Worker tests for attachment download, retry transitions and AI failure fallback
- End-to-end smoke test covering LINE event fixture to searchable Note
- `npm run lint` and `npm run build`
- Manual UI verification in a browser for search, filters, attachments and Settings

## Operational assumptions

- The operator owns a LINE Official Account and has its channel secret/access token.
- The server can expose an HTTPS webhook URL to LINE, directly or through a tunnel.
- PostgreSQL data and local file storage are backed up independently.
- OpenRouter usage may incur cost and sends embedding input outside the private server; Ollama avoids that network transfer.

## Open decisions for implementation planning

- Choose the initial embedding model for each provider.
- Choose the worker scheduling mechanism: database polling versus a lightweight queue.
- Choose the local storage directory and backup retention policy.
- Confirm the maximum accepted file size and retention policy for raw webhook payloads.
