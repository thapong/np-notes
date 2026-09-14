import { loadConfig } from "../config";
import { OllamaProvider } from "./ollama-provider";
import { OpenRouterProvider } from "./openrouter-provider";
import type { EmbeddingProvider } from "./provider";
export function createEmbeddingProvider(): EmbeddingProvider { const config = loadConfig(); return config.aiProvider === "ollama" ? new OllamaProvider({ provider: "ollama", aiEmbeddingModel: config.aiEmbeddingModel, ollamaBaseUrl: config.ollamaBaseUrl, openRouterApiKey: config.openRouterApiKey }) : new OpenRouterProvider({ provider: "openrouter", aiEmbeddingModel: config.aiEmbeddingModel, ollamaBaseUrl: config.ollamaBaseUrl, openRouterApiKey: config.openRouterApiKey }); }
