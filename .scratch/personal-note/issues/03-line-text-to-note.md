# 03: LINE Text to Note

**What to build:** A signed LINE text Webhook creates a searchable Note, supports `#หมวดหมู่`, and safely ignores duplicate deliveries.

**Blocked by:** 01: Foundation & Local Deployment; 02: Manual Note & Keyword Search

**Status:** ready-for-agent

- [ ] The Webhook validates the LINE signature over the exact raw request body.
- [ ] Invalid signatures are rejected without persistence.
- [ ] Valid text events are persisted and later processed into Notes.
- [ ] `#งาน โทรติดตามลูกค้า` assigns the Note to `งาน` and removes the marker from searchable content.
- [ ] Text without a valid marker remains in `ยังไม่จัดหมวด`.
- [ ] Duplicate LINE event IDs do not create duplicate Notes.
- [ ] The Webhook responds quickly without waiting for AI or file processing.
- [ ] A signed fixture can be traced from Webhook Events to a Note visible in the Notes screen.
