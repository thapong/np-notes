import { loadConfig } from "@/src/server/config";
import { createEmbeddingProvider } from "@/src/server/ai/provider-factory";
export async function GET() { const config = loadConfig(); const provider = createEmbeddingProvider(); return Response.json({ provider: config.aiProvider, model: config.aiEmbeddingModel, health: await provider.healthCheck(), externalData: config.aiProvider === "openrouter" }); }
