# 07: Dashboard, Slide Menu & Management UI

**What to build:** The complete single-user interface provides a Dashboard, responsive Slide Menu, Note management, category management, Webhook monitoring, and AI settings.

**Blocked by:** 02: Manual Note & Keyword Search; 03: LINE Text to Note; 04: LINE Attachments; 06: Webhook Reliability & Re-indexing

**Status:** ready-for-agent

- [ ] Dashboard is the default page and shows recent Notes, category counts, processing failures, and a search entry point.
- [ ] Slide Menu contains Dashboard, Notes, Categories, Webhook Events, and Settings.
- [ ] Slide Menu opens/closes on desktop, becomes a drawer on small screens, and shows active navigation state.
- [ ] Notes screen supports hybrid search, filters, pagination, category actions, and empty/error/loading states.
- [ ] Note detail shows text, attachments, source metadata, category, and processing status.
- [ ] Categories screen supports create, rename, color, assignment, and merge behavior.
- [ ] Webhook Events screen shows status/error details and exposes retry.
- [ ] Settings screen shows provider/model health, OpenRouter privacy warning, and re-index controls.
- [ ] Navigation and responsive behavior are verified at desktop and mobile widths.
