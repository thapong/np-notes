import { query } from "@/src/server/db";
export async function GET() { const result = await query(`SELECT id, event_type, status, attempt_count, last_error, received_at, processed_at FROM webhook_events ORDER BY received_at DESC LIMIT 100`); return Response.json({ items: result.rows }); }
