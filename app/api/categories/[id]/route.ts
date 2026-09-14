import { deleteCategory, updateCategory } from "@/src/server/notes/repository";

type CategoryParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: CategoryParams) {
  const { id } = await params;
  const body = await request.json() as { name?: string };
  if (!body.name?.trim()) return Response.json({ error: "name is required" }, { status: 400 });
  try {
    const category = await updateCategory(id, body.name);
    return category ? Response.json(category) : Response.json({ error: "category not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("categories_slug_key")) return Response.json({ error: "category name already exists" }, { status: 409 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: CategoryParams) {
  const { id } = await params;
  const deleted = await deleteCategory(id);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "category not found" }, { status: 404 });
}
