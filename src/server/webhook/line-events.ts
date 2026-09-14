export type NormalizedLineEvent = { eventId: string; type: string; source: unknown; message?: { id: string; type: string; text?: string; [key: string]: unknown }; raw: Record<string, unknown> };

export function normalizeLineEvent(payload: unknown): NormalizedLineEvent[] {
  if (!payload || typeof payload !== "object") throw new Error("Invalid LINE payload");
  const events = (payload as { events?: unknown }).events;
  if (!Array.isArray(events)) throw new Error("LINE payload must contain events");
  return events.map((event) => {
    if (!event || typeof event !== "object") throw new Error("Invalid LINE event");
    const value = event as Record<string, unknown>; const message = value.message as Record<string, unknown> | undefined;
    return { eventId: String(value.webhookEventId ?? `${value.timestamp ?? Date.now()}-${Math.random()}`), type: String(value.type ?? "unknown"), source: value.source, message: message ? { ...message, id: String(message.id ?? ""), type: String(message.type ?? "unknown") } : undefined, raw: value };
  });
}
