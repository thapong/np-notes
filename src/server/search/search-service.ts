import { query } from "../db";
import { createEmbeddingProvider } from "../ai/provider-factory";
export type SearchFilters = { query: string; categoryId?: string; contentType?: string; page?: number; pageSize?: number };
export async function searchNotes(filters: SearchFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const values: unknown[] = [filters.query];
  const where: string[] = [];
  if (filters.categoryId) { values.push(filters.categoryId); where.push(`n.category_id = $${values.length}`); }
  if (filters.contentType) { values.push(filters.contentType); where.push(`n.content_type = $${values.length}`); }
  let vector: number[] | null = null;
  try { vector = await createEmbeddingProvider().embedOne(filters.query); } catch { vector = null; }
  if (vector) values.push(`[${vector.join(",")}]`);
  if (!vector) where.push("n.search_document @@ plainto_tsquery('simple', $1)");
  const vectorScore = vector ? `COALESCE(1 - (ne.embedding <=> $${values.length}::vector), 0)` : "0";
  const keywordScore = "ts_rank_cd(n.search_document, plainto_tsquery('simple', $1))";
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  values.push(pageSize, (page - 1) * pageSize);
  const rows = await query<Record<string, unknown>>(
    `SELECT n.id, n.category_id, n.source, n.content_type, n.text_content, n.location_json, n.captured_at, n.created_at, n.updated_at, c.name AS category_name, (${keywordScore} * 0.5 + ${vectorScore} * 0.5) AS score FROM notes n LEFT JOIN categories c ON c.id = n.category_id LEFT JOIN LATERAL (SELECT embedding FROM note_embeddings WHERE note_id = n.id ORDER BY created_at DESC LIMIT 1) ne ON true ${clause} ORDER BY score DESC, n.captured_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  return {
    items: rows.rows.map((row) => ({
      id: String(row.id), categoryId: row.category_id ? String(row.category_id) : null,
      categoryName: row.category_name ? String(row.category_name) : null,
      source: row.source, contentType: String(row.content_type),
      textContent: row.text_content ? String(row.text_content) : null,
      locationJson: row.location_json ?? null,
      capturedAt: new Date(String(row.captured_at)).toISOString(),
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
      score: Number(row.score ?? 0),
    })),
    page, pageSize,
  };
}
