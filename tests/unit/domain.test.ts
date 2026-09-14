import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseCategory } from "../../src/server/notes/category-parser";
import { verifyLineSignature } from "../../src/server/webhook/line-signature";
import { normalizeLineEvent } from "../../src/server/webhook/line-events";

describe("note domain", () => {
  it("parses a category marker", () => expect(parseCategory("#งาน โทรหาลูกค้า")).toEqual({ categoryName: "งาน", searchableText: "โทรหาลูกค้า" }));
  it("verifies LINE signatures", () => { const body = '{"events":[]}'; const secret = "secret"; const signature = createHmac("sha256", secret).update(body).digest("base64"); expect(verifyLineSignature(body, signature, secret)).toBe(true); expect(verifyLineSignature(body + "x", signature, secret)).toBe(false); });
  it("normalizes message and non-message events", () => { const events = normalizeLineEvent({ events: [{ webhookEventId: "1", type: "message", message: { id: "m1", type: "text", text: "hello" } }, { webhookEventId: "2", type: "follow" }] }); expect(events[0].message?.id).toBe("m1"); expect(events[1].type).toBe("follow"); });
});
