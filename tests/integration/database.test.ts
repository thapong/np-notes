import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { query, getPool } from "../../src/server/db";
import { createNote, deleteCategory, getOrCreateCategory, updateCategory } from "../../src/server/notes/repository";

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

  it("updates a category and unassigns its Notes when deleted", async () => {
    const category = await getOrCreateCategory(`CRUD test ${Date.now()}`);
    const note = await createNote({ source: "web", contentType: "text", textContent: "category CRUD test", categoryId: category.id });
    const updated = await updateCategory(category.id, "CRUD test renamed");
    expect(updated?.name).toBe("CRUD test renamed");

    expect(await deleteCategory(category.id)).toBe(true);
    const noteAfterDelete = await query<{ category_id: string | null }>("SELECT category_id FROM notes WHERE id = $1", [note.id]);
    expect(noteAfterDelete.rows[0].category_id).toBeNull();
    await query("DELETE FROM notes WHERE id = $1", [note.id]);
  });
});
