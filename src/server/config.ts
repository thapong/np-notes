export type AiProviderName = "ollama" | "openrouter";

export type AppConfig = {
  databaseUrl: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  storageRoot: string;
  aiProvider: AiProviderName;
  aiEmbeddingModel: string;
  ollamaBaseUrl: string;
  openRouterApiKey?: string;
  workerIntervalMs: number;
  maxAttachmentBytes: number;
  maxWebhookAttempts: number;
  aiRequestTimeoutMs: number;
};

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required configuration: ${name}`);
  }
  return value;
}

function positiveInteger(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
): number {
  const rawValue = env[name]?.trim();
  const value = rawValue === undefined || rawValue === "" ? fallback : Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Configuration ${name} must be a positive integer`);
  }

  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const aiProvider = (env.AI_PROVIDER?.trim().toLowerCase() || "ollama") as AiProviderName;

  if (aiProvider !== "ollama" && aiProvider !== "openrouter") {
    throw new Error("Configuration AI_PROVIDER must be ollama or openrouter");
  }

  const openRouterApiKey = env.OPENROUTER_API_KEY?.trim() || undefined;
  if (aiProvider === "openrouter" && !openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required when AI_PROVIDER is openrouter");
  }

  return {
    databaseUrl: required(env, "DATABASE_URL"),
    lineChannelSecret: required(env, "LINE_CHANNEL_SECRET"),
    lineChannelAccessToken: required(env, "LINE_CHANNEL_ACCESS_TOKEN"),
    storageRoot: env.STORAGE_ROOT?.trim() || "./storage",
    aiProvider,
    aiEmbeddingModel: env.AI_EMBEDDING_MODEL?.trim() || "embeddinggemma",
    ollamaBaseUrl: env.OLLAMA_BASE_URL?.trim() || "http://ollama:11434",
    openRouterApiKey,
    workerIntervalMs: positiveInteger(env, "WORKER_INTERVAL_MS", 2000),
    maxAttachmentBytes: positiveInteger(env, "MAX_ATTACHMENT_BYTES", 50 * 1024 * 1024),
    maxWebhookAttempts: positiveInteger(env, "MAX_WEBHOOK_ATTEMPTS", 5),
    aiRequestTimeoutMs: positiveInteger(env, "AI_REQUEST_TIMEOUT_MS", 10000),
  };
}
