import type { EmbeddingProvider, ProviderConfig } from "./provider";
export class OllamaProvider implements EmbeddingProvider {
  constructor(private readonly config: ProviderConfig) {}
  getModelInfo() { return { provider: "ollama" as const, model: this.config.aiEmbeddingModel }; }
  private async request(input: string | string[]) { const response = await fetch(`${this.config.ollamaBaseUrl}/api/embed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: this.config.aiEmbeddingModel, input }), signal: AbortSignal.timeout(30000) }); if (!response.ok) throw new Error(`Ollama embedding failed: ${response.status}`); const data = await response.json() as { embeddings?: number[][] }; if (!data.embeddings?.length) throw new Error("Ollama returned no embeddings"); return data.embeddings; }
  async embedOne(text: string) { return (await this.request(text))[0]; }
  async embedMany(texts: string[]) { return this.request(texts); }
  async healthCheck() { try { await this.request("health check"); return { ok: true, detail: "Ollama embedding is available" }; } catch (error) { return { ok: false, detail: error instanceof Error ? error.message : "Ollama unavailable" }; } }
}
