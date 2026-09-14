import type { EmbeddingProvider, ProviderConfig } from "./provider";
export class OpenRouterProvider implements EmbeddingProvider {
  constructor(private readonly config: ProviderConfig) { if (!config.openRouterApiKey) throw new Error("OPENROUTER_API_KEY is required"); }
  getModelInfo() { return { provider: "openrouter" as const, model: this.config.aiEmbeddingModel }; }
  private async request(input: string | string[]) { const response = await fetch("https://openrouter.ai/api/v1/embeddings", { method: "POST", headers: { authorization: `Bearer ${this.config.openRouterApiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: this.config.aiEmbeddingModel, input }), signal: AbortSignal.timeout(30000) }); if (!response.ok) throw new Error(`OpenRouter embedding failed: ${response.status}`); const data = await response.json() as { data?: Array<{ embedding: number[] }> }; const vectors = data.data?.map((item) => item.embedding) ?? []; if (!vectors.length) throw new Error("OpenRouter returned no embeddings"); return vectors; }
  async embedOne(text: string) { return (await this.request(text))[0]; }
  async embedMany(texts: string[]) { return this.request(texts); }
  async healthCheck() { try { await this.request("health check"); return { ok: true, detail: "OpenRouter embedding is available" }; } catch (error) { return { ok: false, detail: error instanceof Error ? error.message : "OpenRouter unavailable" }; } }
}
