# End-to-end tests

All network-backed test suites share a disk cache, including model evaluations. It records ordinary responses, native streaming chunks, and model details. Ordinary test runs reuse recordings and contact Cognitive only on a cache miss.

```sh
pnpm test:e2e
```

Pull-request CI runs the offline tests and replays the E2E suite from the committed production recordings. Missing recordings fail the job instead of making live provider requests. The three accepted model limitations below are skipped in the blocking suite and evaluated in a separate non-blocking CI step. To check current staging/provider behavior, manually run the **Run LLMz Tests** workflow with **live** enabled; it refreshes responses against staging using a temporary bot.

## Quarantined model cases

The quarantine registry in `__tests__/quarantine.ts` exempts only these model/scenario pairs:

| Model                   | Scenario                         | Known failure                                           |
| ----------------------- | -------------------------------- | ------------------------------------------------------- |
| `groq:qwen3.8-27b`      | Bare product lookup (Tomatoes)   | Closing thinking tag leaks into the reply.              |
| `cerebras:gpt-oss-120b` | Introduction with choice buttons | Component call appears as text instead of buttons.      |
| `groq:gpt-oss-120b`     | Introduction with choice buttons | Buttons arrive without the requested text introduction. |

All other model/scenario combinations remain blocking. Quarantined cases retain every assertion and their original recordings. Their separate command returns a failure exit code when they fail; only the CI step is non-blocking. A passing evaluation remains visible as a pass, so remove its registry entry once the behavior is fixed and verified.

```sh
# Replay only the quarantined cases, with no network requests
LLMZ_E2E_CACHE_MODE=replay pnpm test:e2e:quarantine

# Evaluate fresh provider responses (requires credentials)
LLMZ_E2E_CACHE_MODE=refresh pnpm test:e2e:quarantine
```

Neither the quarantine-only run nor a run that skips quarantined cases prunes recordings. This preserves the evidence for these failures.

## Cache modes

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

Cache identity includes the complete request (instructions, messages, tools, tool control, model, and generation settings), response mode, and API endpoint. Transport-only cache flags, abort signals, and recognized diagnostic IDs are excluded. Variable inventory ordering is normalized because assignment timestamps can reorder it between identical runs; variable names, values, ages, and all other request content remain significant. Native call IDs and their result relationships are preserved. Older recordings are re-keyed from their stored requests.

Model evaluations send an explicit model array to disable Cognitive's automatic fallback ladder. Additional models are used only when explicitly configured through `LLMZ_EVAL_FALLBACK_MODELS`. A provider rate limit therefore fails the evaluation instead of silently testing a different provider.

Failed requests, unfinished streams, canceled consumers, and error chunks are never cached. Responses reporting rate limits in provider warnings or stream restarts are also excluded, including successful fallback responses; existing recordings with those diagnostics are ignored. Other complete model responses are recorded even when a test assertion subsequently fails: caching must reproduce failures, not silently select successful samples. New regression tests for the cache live beside its implementation in `__tests__/cached-cognitive.test.ts` and run with `pnpm test` without network access.

A complete, unfiltered `pnpm test:e2e` run automatically prunes unused old recordings. Cache hits are marked in a temporary usage journal; newly recorded responses are preserved. Failed assertions still mark their recordings as used, so replay preserves failures. The final report counts retained and removed entries from the cache at the start of the run.

Filtered runs (including filenames, test names, models, exclusions and shards), watch mode, interrupted runs, skipped tests, failed hooks, unhandled errors, cache misses in replay mode and failed network requests never prune. Replacing the configured reporters with `--reporter` also disables automatic cleanup. No cleanup is performed while another writer holds the cache lock or when the cache was replaced during the run.
