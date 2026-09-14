import { getOrCreateCategory } from "@/src/server/notes/repository";
export async function POST(request: Request) { const body = await request.json() as { name?: string }; if (!body.name?.trim()) return Response.json({ error: "name is required" }, { status: 400 }); return Response.json(await getOrCreateCategory(body.name), { status: 201 }); }
