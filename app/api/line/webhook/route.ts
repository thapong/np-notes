import { loadConfig } from "@/src/server/config";
import { persistWebhookEvents } from "@/src/server/webhook/event-repository";
import { normalizeLineEvent } from "@/src/server/webhook/line-events";
import { verifyLineSignature } from "@/src/server/webhook/line-signature";
export async function POST(request: Request) { const rawBody = await request.text(); const config = loadConfig(); const signature = request.headers.get("x-line-signature") ?? ""; if (!verifyLineSignature(rawBody, signature, config.lineChannelSecret)) return Response.json({ error: "Invalid signature" }, { status: 401 }); try { const events = normalizeLineEvent(JSON.parse(rawBody)); await persistWebhookEvents(events); return Response.json({ accepted: events.length }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid webhook" }, { status: 400 }); } }
