# 06: Webhook Reliability & Re-indexing

**What to build:** Webhook processing is asynchronous, observable, retryable, and recoverable when downloads or AI calls fail.

**Blocked by:** 03: LINE Text to Note; 04: LINE Attachments; 05: AI Provider & Semantic Search

**Status:** ready-for-agent

- [ ] A worker polls pending events using row locking so concurrent workers do not process an event twice.
- [ ] Events transition through pending, processing, completed, and failed states.
- [ ] Retryable failures use bounded retries and preserve the last error.
- [ ] Failed events can be retried from the application.
- [ ] AI failures do not roll back a valid Note or attachment.
- [ ] Re-index can target all Notes, a category, or Notes missing/stale for the active embedding profile.
- [ ] Health status exposes database, worker, and selected AI provider state.
- [ ] Tests cover restart recovery, duplicate processing, retry exhaustion, and re-index scope.
