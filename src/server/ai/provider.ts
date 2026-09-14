import type { AiProviderName, AppConfig } from "../config";
export type EmbeddingProvider = { embedOne(text: string): Promise<number[]>; embedMany(texts: string[]): Promise<number[][]>; getModelInfo(): { provider: AiProviderName; model: string }; healthCheck(): Promise<{ ok: boolean; detail: string }> };
export type EmbeddingResult = { vectors: number[][]; model: string; dimension: number };
export type ProviderConfig = Pick<AppConfig, "aiEmbeddingModel" | "ollamaBaseUrl" | "openRouterApiKey" | "aiRequestTimeoutMs"> & { provider: AiProviderName };
