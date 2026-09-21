# End-to-end tests

All network-backed test suites share a disk cache, including model evaluations. It records ordinary responses, native streaming chunks, and model details. Ordinary test runs reuse recordings and contact Cognitive only on a cache miss.

```sh
pnpm test:e2e
```

Set `LLMZ_E2E_CACHE_MODE` to choose the behavior:

| Mode             | Existing recording | Missing recording                               |
| ---------------- | ------------------ | ----------------------------------------------- |
| `auto` (default) | Replay             | Request and record                              |
| `replay`         | Replay             | Fail immediately; no network                    |
| `refresh`        | Ignore             | Request with server caching disabled and record |

Replay requires no credentials. Recording requires `CLOUD_PAT` and `CLOUD_BOT_ID`; `CLOUD_API_ENDPOINT` defaults to production. Override `LLMZ_E2E_CACHE_PATH` to use a separate JSONL file; the default is `e2e/__tests__/cache.jsonl`. `LLMZ_E2E_FRESH=1` remains an alias for refresh unless an explicit cache mode is supplied.

```sh
# Deterministic replay of previously recorded integration tests
LLMZ_E2E_CACHE_MODE=replay pnpm test:e2e

# Choose the model to evaluate, using existing recordings where available
LLMZ_EVAL_MODELS=openai:gpt-5.6-luna pnpm test:e2e

# Explicit live evaluation: new provider samples, no response-cache hits
LLMZ_EVAL_MODELS=openai:gpt-5.6-luna LLMZ_E2E_CACHE_MODE=refresh pnpm test:e2e
```

Use refresh mode when evaluating model reliability or independent repeated samples. Replay tests recorded behavior; it is not evidence that a production deployment or live model now passes. Route checks remain active in every mode, and refresh evaluations still reject cached samples. Local replay marks generation metadata as cached and reports zero request cost while retaining the original token usage.

Cache identity includes the complete request (instructions, messages, tools, tool control, model, and generation settings), response mode, and API endpoint. Only transport-only cache flags, abort signals, and recognized diagnostic IDs are excluded. Native call IDs and their result relationships are preserved. Older recordings are re-keyed from their stored requests.

Model evaluations send an explicit model array to disable Cognitive's automatic fallback ladder. Additional models are used only when explicitly configured through `LLMZ_EVAL_FALLBACK_MODELS`. A provider rate limit therefore fails the evaluation instead of silently testing a different provider.

Failed requests, unfinished streams, canceled consumers, and error chunks are never cached. Responses reporting rate limits in provider warnings or stream restarts are also excluded, including successful fallback responses; existing recordings with those diagnostics are ignored. Other complete model responses are recorded even when a test assertion subsequently fails: caching must reproduce failures, not silently select successful samples. New regression tests for the cache live beside its implementation in `__tests__/cached-cognitive.test.ts` and run with `pnpm test` without network access.
