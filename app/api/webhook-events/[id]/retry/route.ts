import { retryWebhookEvent } from "@/src/server/webhook/event-repository";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (await retryWebhookEvent(id)) ? Response.json({ queued: true }) : Response.json({ error: "event not found or not retryable" }, { status: 404 });
}
