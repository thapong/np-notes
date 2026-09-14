import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { query, getPool } from "../../src/server/db";
import { processWebhookEvent } from "../../src/worker/process-webhook-event";

describe("webhook worker", () => {
  let eventId = "";
  beforeAll(async () => { const result = await query<{ id: string }>(`INSERT INTO webhook_events (line_event_id, event_type, payload_json) VALUES ('integration-worker-1', 'message', $1) RETURNING id`, [{ message: { id: "line-message-1", type: "text", text: "#งาน โทรติดตามลูกค้า" }, timestamp: Date.now() }]); eventId = result.rows[0].id; });
  afterAll(async () => { await query("DELETE FROM notes WHERE line_message_id = 'line-message-1'"); await query("DELETE FROM webhook_events WHERE line_event_id = 'integration-worker-1'"); await getPool().end(); });
  it("turns a text event into a categorized Note", async () => { expect(await processWebhookEvent(eventId)).toEqual({ ok: true }); const note = await query<{ text_content: string; status: string }>(`SELECT n.text_content, e.status FROM notes n JOIN webhook_events e ON e.line_event_id = 'integration-worker-1' WHERE n.line_message_id = 'line-message-1'`); expect(note.rows[0].text_content).toBe("โทรติดตามลูกค้า"); expect(note.rows[0].status).toBe("completed"); });
});
