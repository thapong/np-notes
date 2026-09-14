import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/server/config";

const baseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://np_note:secret@localhost:5432/np_note",
  LINE_CHANNEL_SECRET: "line-secret",
  LINE_CHANNEL_ACCESS_TOKEN: "line-token",
};

describe("loadConfig", () => {
  it("loads local Ollama defaults without requiring an OpenRouter key", () => {
    const config = loadConfig(baseEnv);

    expect(config.aiProvider).toBe("ollama");
    expect(config.aiEmbeddingModel).toBe("embeddinggemma");
    expect(config.ollamaBaseUrl).toBe("http://ollama:11434");
    expect(config.maxAttachmentBytes).toBe(50 * 1024 * 1024);
  });

  it("requires an OpenRouter key when OpenRouter is selected", () => {
    expect(() => loadConfig({ ...baseEnv, AI_PROVIDER: "openrouter" })).toThrow(
      "OPENROUTER_API_KEY is required",
    );
  });

  it("rejects invalid provider and numeric settings", () => {
    expect(() => loadConfig({ ...baseEnv, AI_PROVIDER: "unknown" })).toThrow(
      "AI_PROVIDER must be ollama or openrouter",
    );
    expect(() => loadConfig({ ...baseEnv, WORKER_INTERVAL_MS: "0" })).toThrow(
      "WORKER_INTERVAL_MS must be a positive integer",
    );
  });

  it("requires secrets without including their values in errors", () => {
    expect(() => loadConfig({ ...baseEnv, DATABASE_URL: " " })).toThrow(
      "Missing required configuration: DATABASE_URL",
    );
  });
});
