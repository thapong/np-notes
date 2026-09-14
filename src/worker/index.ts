import { loadConfig } from "@/src/server/config";
import { claimPendingEvents } from "@/src/server/webhook/event-repository";
import { processWebhookEvent } from "./process-webhook-event";
export async function runWorkerOnce() { const events = await claimPendingEvents(); for (const event of events) await processWebhookEvent(String(event.id)); return events.length; }
if (process.env.RUN_WORKER === "true") { const config = loadConfig(); const loop = async () => { await runWorkerOnce(); setTimeout(loop, config.workerIntervalMs); }; void loop(); }
