import { getNote } from "@/src/server/notes/repository";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { const note = await getNote((await context.params).id); return note ? Response.json(note) : Response.json({ error: "Not found" }, { status: 404 }); }
