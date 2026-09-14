import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { query, getPool } from "../../src/server/db";

describe("PostgreSQL foundation", () => {
  beforeAll(async () => {
    const extension = await query<{ extname: string }>("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    expect(extension.rows).toHaveLength(1);
  });

  afterAll(async () => { await getPool().end(); });

  it("persists a Note and maintains its full-text document", async () => {
    const result = await query<{ id: string; search_document: string }>(`INSERT INTO notes (source, content_type, text_content, captured_at) VALUES ('web', 'text', 'โทรติดตามลูกค้า', now()) RETURNING id, search_document::text`);
    expect(result.rows[0].id).toBeTruthy();
    expect(result.rows[0].search_document).toContain("โทรติดตามลูกค้า");
    await query("DELETE FROM notes WHERE id = $1", [result.rows[0].id]);
  });
});
