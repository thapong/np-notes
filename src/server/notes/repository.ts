import { query, withTransaction } from "../db";
import type { CategoryRecord, CreateNoteInput, NoteFilters, NoteRecord, PaginatedNotes } from "./types";

const mapNote = (row: Record<string, unknown>): NoteRecord => ({
  id: String(row.id), categoryId: row.category_id ? String(row.category_id) : null,
  categoryName: row.category_name ? String(row.category_name) : null,
  source: row.source as NoteRecord["source"], contentType: String(row.content_type),
  textContent: row.text_content ? String(row.text_content) : null, locationJson: row.location_json ?? null,
  capturedAt: new Date(String(row.captured_at)).toISOString(), createdAt: new Date(String(row.created_at)).toISOString(),
  updatedAt: new Date(String(row.updated_at)).toISOString(),
});

export async function getOrCreateCategory(name: string): Promise<CategoryRecord> {
  const slug = name.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "uncategorized";
  const result = await query<Record<string, unknown>>(
    `INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now() RETURNING id, name, slug, color`,
    [name.trim(), slug],
  );
  return result.rows[0] as unknown as CategoryRecord;
}

export async function createNote(input: CreateNoteInput): Promise<NoteRecord> {
  const result = await query<Record<string, unknown>>(
    `INSERT INTO notes (category_id, source, content_type, text_content, location_json, line_message_id, captured_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [input.categoryId ?? null, input.source, input.contentType, input.textContent ?? null, input.locationJson ?? null, input.lineMessageId ?? null, input.capturedAt ?? new Date()],
  );
  return mapNote(result.rows[0]);
}

export async function createNoteWithCategory(input: CreateNoteInput & { categoryName?: string | null }): Promise<NoteRecord> {
  return withTransaction(async (client) => {
    let categoryId = input.categoryId ?? null;
    if (!categoryId && input.categoryName) {
      const category = await client.query<Record<string, unknown>>(`INSERT INTO categories (name, slug) VALUES ($1, regexp_replace(lower($1), '[^a-z0-9ก-๙]+', '-', 'g')) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [input.categoryName]);
      categoryId = String(category.rows[0].id);
    }
    const result = await client.query<Record<string, unknown>>(`INSERT INTO notes (category_id, source, content_type, text_content, location_json, line_message_id, captured_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [categoryId, input.source, input.contentType, input.textContent ?? null, input.locationJson ?? null, input.lineMessageId ?? null, input.capturedAt ?? new Date()]);
    return mapNote(result.rows[0]);
  });
}

export async function createAttachment(input: { noteId: string; lineMessageId?: string | null; originalName?: string; mimeType: string; sizeBytes: number; storagePath: string; sha256: string }) {
  const result = await query(`INSERT INTO attachments (note_id, line_message_id, original_name, mime_type, size_bytes, storage_path, sha256) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [input.noteId, input.lineMessageId ?? null, input.originalName ?? null, input.mimeType, input.sizeBytes, input.storagePath, input.sha256]);
  return result.rows[0];
}

export async function getNote(id: string): Promise<NoteRecord | null> {
  const result = await query<Record<string, unknown>>(`SELECT n.*, c.name AS category_name FROM notes n LEFT JOIN categories c ON c.id = n.category_id WHERE n.id = $1`, [id]);
  return result.rows[0] ? mapNote(result.rows[0]) : null;
}

export async function listNotes(filters: NoteFilters = {}): Promise<PaginatedNotes> {
  const page = Math.max(1, filters.page ?? 1); const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20)); const values: unknown[] = []; const where: string[] = [];
  if (filters.query?.trim()) { values.push(filters.query.trim()); where.push(`n.search_document @@ plainto_tsquery('simple', $${values.length})`); }
  if (filters.categoryId) { values.push(filters.categoryId); where.push(`n.category_id = $${values.length}`); }
  if (filters.contentType) { values.push(filters.contentType); where.push(`n.content_type = $${values.length}`); }
  if (filters.from) { values.push(filters.from); where.push(`n.captured_at >= $${values.length}`); }
  if (filters.to) { values.push(filters.to); where.push(`n.captured_at < $${values.length}`); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await query<{ count: string }>(`SELECT count(*)::text AS count FROM notes n ${clause}`, values);
  values.push(pageSize, (page - 1) * pageSize);
  const rows = await query<Record<string, unknown>>(`SELECT n.*, c.name AS category_name FROM notes n LEFT JOIN categories c ON c.id = n.category_id ${clause} ORDER BY n.captured_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { items: rows.rows.map(mapNote), page, pageSize, total: Number(count.rows[0].count) };
}
