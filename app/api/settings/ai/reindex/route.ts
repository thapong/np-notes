import { reindexMissingEmbeddings } from "@/src/server/search/reindex";

export async function POST() {
  try {
    return Response.json(await reindexMissingEmbeddings());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Re-index failed" }, { status: 503 });
  }
}
