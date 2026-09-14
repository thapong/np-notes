# 05: AI Provider & Semantic Search

**What to build:** The user can choose Ollama or OpenRouter for embeddings and search Notes by meaning as well as by exact words.

**Blocked by:** 02: Manual Note & Keyword Search; 03: LINE Text to Note

**Status:** ready-for-agent

- [ ] A common embedding interface supports one text, batches, model information, and health checks.
- [ ] Ollama calls the local embedding endpoint and works with `embeddinggemma` by default.
- [ ] OpenRouter calls its embeddings endpoint with bearer authentication and never persists the API key.
- [ ] Provider/model/dimension profiles are stored with embeddings.
- [ ] Changing provider or model creates a re-indexable profile rather than mutating Note content.
- [ ] Semantic search returns Notes with similar meaning even when exact terms differ.
- [ ] Hybrid ranking combines keyword and vector relevance deterministically.
- [ ] AI timeout, unavailable provider, and invalid vector responses fall back to keyword search and preserve Note creation.
