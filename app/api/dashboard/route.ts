import { query } from "@/src/server/db";

export async function GET() {
  const [counts, recent] = await Promise.all([
    query<{ notes: string; categories: string; processing: string }>(`SELECT (SELECT count(*) FROM notes)::text AS notes, (SELECT count(*) FROM categories)::text AS categories, (SELECT count(*) FROM webhook_events WHERE status IN ('pending','processing'))::text AS processing`),
    query<{ id: string; text_content: string | null; category_name: string | null; captured_at: string }>(`SELECT n.id, n.text_content, c.name AS category_name, n.captured_at FROM notes n LEFT JOIN categories c ON c.id = n.category_id ORDER BY n.captured_at DESC LIMIT 5`),
  ]);
  return Response.json({ counts: counts.rows[0], recent: recent.rows });
}
