# Native protocol live evaluation — September 18, 2026

The native runtime works against live providers, but this evaluation does **not** establish readiness for a broad rollout or retention of 90% of the previous runtime's capabilities. The main remaining problems are model instruction adherence, presentation-batch completion, and provider transport/routing compatibility.

## Method

All tasks used synthetic fixtures. Business tools changed local counters or fixture objects only. Credentials were passed through the process environment and are absent from this report and source files.

The main matrix ran 144 tasks in 12 languages, each in streaming and nonstreaming mode: 288 requests per requested model. It checked the first response without execution repair or test retries. Cache bypass was enabled; a response from another model did not count as a pass. Results below include exact wording, silence, component payloads, control flow, and worker exit requirements, not merely valid tool syntax.

The full-runtime suite separately exercised actual JavaScript tools, retries, independent parallel operations, typed exits, rich components, and completion budgets. Examples were disabled for this run.

## First-response matrix

| Requested model                               | Scheduled cases | Completed on requested model, without fallback/cache | Strict task passes in those samples | Native-call validation |
| --------------------------------------------- | --------------: | ---------------------------------------------------: | ----------------------------------: | ---------------------: |
| `openai:gpt-5.6-luna`                         |             288 |                                                  212 |                     193/212 (91.0%) |                212/212 |
| `anthropic-bedrock:claude-haiku-4-5-20251001` |             288 |                                                  288 |                     155/288 (53.8%) |                288/288 |

Empty call arrays also pass native-call validation. That column establishes response validity, not task completion.

Luna's remaining 76 scheduled cases were not usable Luna samples: 73 completed through other models and three did not produce a completed evaluation record. Gateway warnings reported `quota_exceeded` and a fallback chain through GPT-5.2, GPT-5.1, and GPT-5.6 Sol routes. Across both requested models, the strict test runner reported **348 passing and 228 failing cases**; provider substitutions are among those failures.

The exact warning was `Model 'openai:gpt-5.6-luna' is degraded: quota_exceeded (recovers in 300s)`, with the same classification for `openai:gpt-5.2-2025-12-11` and `openai:gpt-5.1-2025-11-13`. One response carrying these warnings has request ID `req-1287216a-982b-4ee7-93b0-eb4b090b77c6`.

The quota diagnosis was corrected after the user supplied a provider log: OpenAI returned HTTP 400 / `invalid_request_error` because the request body was invalid JSON. Its explanatory text included “missing quotation marks”; a loose match for `quota` inside `quotation` misclassified it as quota exhaustion, triggering a 300-second degradation and fallback. The gateway warning is not evidence of exhausted quota. Error classification and the malformed outbound JSON require separate fixes.

The 91.0% figure describes this selected, partially completed Luna sample. It is not a comparison with LLMz 0.x, a confidence bound, or proof of the user's 90% capability-retention goal.

Luna failures concentrated on incomplete button batches and exact greeting wording. Haiku's failures included extra progress text, fenced JSON when plain JSON text was requested, added worker prose, and exact greeting/question requirements. These are behavioral failures even when the returned calls are valid. Rich presentations without a terminal call can consume another response and may exhaust a small response budget.

## Full runtime

| Requested model                               | Strict passes | Remaining failures                                                                                                              |
| --------------------------------------------- | ------------: | ------------------------------------------------------------------------------------------------------------------------------- |
| `openai:gpt-5.6-luna`                         |         12/16 | Early completion during recovery, missed retry after an update, rich-message loop exhaustion, and one unexpected provider route |
| `anthropic-bedrock:claude-haiku-4-5-20251001` |          9/16 | Seven cases with unwanted progress/retry narration or delivery order inconsistent with the requested silence                    |

Successful cases included real tool execution, typed worker results, independent concurrent searches, cards, images, and carousel rendering. Passing execution does not imply that every model obeys silence or batches presentations efficiently.

## Memory and snapshot continuation

The focused follow-up suite covers serialized named variables, `$return`, newest-first `$iterations`, object schemas and access rules, compaction, and snapshot continuation with a required local finalization action. Each phase checks actual provider identity and rejects cached samples.

**All six focused tests passed:** three scenarios on Luna and the same three on Anthropic Bedrock Haiku, using the intended models with fresh responses. This includes serialized variable/result restoration, object updates surviving compaction and unchanged host inputs, and snapshot continuation that finalized exactly once without repeating the earlier effect or approval request.

The first run also exposed a test mistake: restored object properties are inactive until the host supplies their objects again. The corrected test checks persisted state before activation, then checks values after host synchronization. A separate Haiku sample returned the correct snapshot exit payload directly from restored bindings but skipped a requested redundant JavaScript inspection. The follow-up test requires an opaque result from a new local tool, making continuation observable without relying on an unnecessary extra inspection.

## Gemini and provider routing

Both `google-ai:gemini-3.8-flash` and `google-ai:gemini-3.5-flash` returned HTTP 200 with empty output and no `toolCalls` for a minimal direct Cognitive API request asking for `record_number({ value: 42 })`. This reproduction bypassed LLMz and the Cognitive SDK. The same request to Luna returned the expected native call.

| Direct probe         | Request ID                                 | Result                                                         |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Gemini 3.8 Flash     | `req-f55c3edf-384c-4407-ad04-e0f94cad90cc` | Empty output, no calls, `stopReason: stop`                     |
| Gemini 3.5 Flash     | `req-a54d1d94-31ca-42da-864e-14d5b52a0b24` | Empty output, no calls, `stopReason: stop`                     |
| GPT-5.6 Luna control | `req-9f61ab39-e523-4a7f-8039-e7da47b0fbad` | `record_number` with `{ value: 42 }`, `stopReason: tool_calls` |

All three probes reported `cached: false` and an empty fallback path. The result localizes the problem to the gateway/provider path; it does not prove whether the underlying model omitted the call or the gateway discarded it. Google tool-result history tests also fell back to OpenAI and cannot count as Gemini successes. Gemini support should remain uncertified until both native call delivery and continuation are verified.

The direct request was a `POST` to `https://api.botpress.cloud/v2/cognitive/generate-text`, with the supplied authorization and bot headers, and this body (substitute the model under test):

```json
{
  "model": "google-ai:gemini-3.8-flash",
  "messages": [
    { "role": "system", "content": "Call the record_number tool with value 42. Do not answer with text." },
    { "role": "user", "content": "Record the number now." }
  ],
  "tools": [
    {
      "name": "record_number",
      "description": "Record a number",
      "parameters": {
        "type": "object",
        "properties": { "value": { "type": "number" } },
        "required": ["value"],
        "additionalProperties": false
      }
    }
  ],
  "toolControl": { "mode": "auto", "parallel": true },
  "maxTokens": 1600,
  "options": { "skipCache": true }
}
```

Separate minimal probes confirmed that OpenAI and Anthropic Bedrock preserve `listen({})`, both alone and in a batch after two buttons. Missing `listen` in the larger prompts is therefore not evidence of a general empty-argument filtering bug.

The `anthropic:claude-haiku-4-5-20251001` alias consistently resolved to `anthropic-bedrock:claude-haiku-4-5-20251001` even with an empty fallback path. The main matrix therefore pinned the explicit Bedrock route.

## Changes made during evaluation

- The matrix now asserts task correctness; previously it recorded that result but only asserted response shape.
- All evaluation requests bypass provider cache. Full-runtime cases verify the actual model on every generation.
- Route mismatches now log bounded provider metadata, including fallback warnings and request IDs, without request headers or credentials.
- Runtime guidance explicitly requests final rich-message calls and `listen` in the same response, and keeps routine tool calls silent unless updates are requested.
- New live tests cover memory restoration, object state after compaction, and continuation after a snapshot without repeating completed effects.

## Rollout decision

Keep broad provider rollout gated. Resolve the Gemini gateway/provider issue, fix malformed provider requests and error classification, verify intended model routing, and improve presentation completion and instruction adherence on each supported model. Then repeat the matrix with multiple samples and compare against the previous runtime on the same tasks, including calls, cost, latency, and duplicate effects. The deterministic suite and these live samples establish different parts of the contract; neither substitutes for that comparison.
