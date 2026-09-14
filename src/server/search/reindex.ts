import { createEmbeddingProvider } from "../ai/provider-factory";
import { listNotesMissingEmbeddings, saveNoteEmbedding } from "../notes/repository";

export async function reindexMissingEmbeddings() {
  const provider = createEmbeddingProvider();
  const model = provider.getModelInfo();
  const notes = await listNotesMissingEmbeddings();
  let processed = 0;
  let failed = 0;
  for (const note of notes) {
    try {
      const vector = await provider.embedOne(note.text_content);
      await saveNoteEmbedding(note.id, note.text_content, vector, model.provider, model.model);
      processed += 1;
    } catch {
      failed += 1;
    }
  }
  return { total: notes.length, processed, failed, provider: model.provider, model: model.model };
}
