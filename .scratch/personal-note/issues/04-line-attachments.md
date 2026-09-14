# 04: LINE Attachments

**What to build:** LINE image, video, audio, file, location, and sticker messages become inspectable Notes with safe local attachment storage.

**Blocked by:** 03: LINE Text to Note

**Status:** ready-for-agent

- [ ] Image, video, audio, and file content is downloaded from LINE using the channel access token.
- [ ] Attachments are streamed to the configured storage root with generated safe paths.
- [ ] Filename traversal, unsupported MIME types, and files over 50 MB are rejected safely.
- [ ] Attachment metadata includes MIME type, size, original name, hash, and storage reference.
- [ ] Location and sticker events retain useful metadata even when no binary file exists.
- [ ] Note detail displays attachment metadata and provides safe preview/download behavior.
- [ ] Download failure leaves a retryable Webhook event without creating corrupt attachment records.
