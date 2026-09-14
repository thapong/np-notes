import { describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../../src/server/ai/ollama-provider";
import { OpenRouterProvider } from "../../src/server/ai/openrouter-provider";

describe("embedding providers", () => {
  it("maps Ollama embeddings", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ embeddings: [[1, 2, 3]] }), { status: 200 }))); const result = await new OllamaProvider({ provider: "ollama", aiEmbeddingModel: "embeddinggemma", ollamaBaseUrl: "http://ollama", openRouterApiKey: undefined }).embedOne("hello"); expect(result).toEqual([1, 2, 3]); vi.unstubAllGlobals(); });
  it("maps OpenRouter embeddings", async () => { const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ embedding: [4, 5] }] }), { status: 200 })); vi.stubGlobal("fetch", fetchMock); const result = await new OpenRouterProvider({ provider: "openrouter", aiEmbeddingModel: "test/model", ollamaBaseUrl: "http://ollama", openRouterApiKey: "secret" }).embedOne("hello"); expect(result).toEqual([4, 5]); expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: expect.objectContaining({ authorization: "Bearer secret" }) }); vi.unstubAllGlobals(); });
});
