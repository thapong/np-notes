# 08: Deployment, Backup & End-to-End Verification

**What to build:** The application can be installed, configured with LINE and either AI provider, backed up, restored, and verified through a complete user flow.

**Blocked by:** 01: Foundation & Local Deployment; 02: Manual Note & Keyword Search; 03: LINE Text to Note; 04: LINE Attachments; 05: AI Provider & Semantic Search; 06: Webhook Reliability & Re-indexing; 07: Dashboard, Slide Menu & Management UI

**Status:** ready-for-agent

- [ ] README documents Docker Compose startup, environment configuration, LINE Webhook setup, Ollama setup, and OpenRouter setup.
- [ ] Backup documentation covers PostgreSQL data and local attachment storage independently.
- [ ] Restore documentation verifies both database and attachment recovery.
- [ ] An end-to-end fixture covers signed LINE text, category parsing, Note creation, exact search, and semantic search when AI is healthy.
- [ ] The deployment reports a clear degraded state when AI is unavailable instead of claiming semantic search is active.
- [ ] Full lint, build, unit, integration, browser, and end-to-end verification passes.
