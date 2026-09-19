# Native protocol validation and single-tool acceptance — September 18, 2026

Historical baseline: completed before the single-native-tool implementation. All three original runs and corrected citation reruns are complete.

The broad baseline below evaluates the **previous protocol with multiple native tools**: normal assistant text, `run_javascript`, presentation tools, and typed exits. It does not evaluate the subsequent [single-tool design](native-protocol-single-tool-proposal.md). A separate targeted acceptance section records the current implementation's later live samples.

The local implementation passes all deterministic checks, and all three models passed memory/session persistence. Luna and Haiku also passed the corrected search/citation suite. Luna struggles to finish rich-message batches; Haiku frequently adds prose where silence or exact text is required. Gemini's results include unexpected fallback and unresolved generation/empty-answer failures. These evaluations do not establish a runtime parser or executor defect.

## Method

Each model receives 355 cases: 288 first-response protocol cases (12 task types × 12 languages × streaming/non-streaming), 16 runtime behavior cases, 3 memory/session cases, and 48 search/citation cases. Each condition is sampled once, with no test retries, one worker per model, cache bypass, and no explicitly configured fallback models. Runtime cases can require multiple provider requests; 355 is a case count, not a request count.

Actual model, cache, and fallback checks remain separate from native validation and task behavior. A valid native response can still omit a requested call or violate task instructions. The first-response matrix does not allow a later repair response to rescue an incomplete batch.

## Completed results

| Measurement                                                      | OpenAI Luna | Anthropic Bedrock Haiku 4.5 | Gemini 3.8 Flash |
| ---------------------------------------------------------------- | ----------: | --------------------------: | ---------------: |
| First-response test passes, including exact-route assertion      |     258/288 |                     158/288 |          211/288 |
| Task behavior, requested-model responses only                    |     258/288 |                     158/288 |          211/240 |
| Response shape, requested-model responses only                   |     265/288 |                     201/288 |          223/240 |
| Native validation, requested-model responses only                |     288/288 |                     288/288 |          240/240 |
| Exact-model, uncached matrix responses, without fallback/restart |     288/288 |                     288/288 |          240/288 |
| Runtime behavior                                                 |       15/16 |                        9/16 |            14/16 |
| Memory/session                                                   |         3/3 |                         3/3 |              3/3 |
| Corrected search/citation rerun                                  |       48/48 |                       48/48 |            39/48 |

Requested routes were `openai:gpt-5.6-luna`, `anthropic-bedrock:claude-haiku-4-5-20251001`, and `google-ai:gemini-3.8-flash`. Luna and Haiku logged no model-route mismatch in either their primary runs or corrected citation reruns. Their corrected citation assertions passed, including exact route, uncached response, and empty fallback path. Gemini's 48 matrix responses served by OpenAI are excluded from its requested-model measurements, even though their native validation and task checks passed.

## What failed

**Luna:** 23 of its 30 first-response failures are the two-button scenario. Only 1/24 responses supplied both buttons and the terminal `listen` call together. Ten returned both buttons without `listen`, seven returned one button, and six returned no calls. The remaining seven failures are exact-text checks: six greetings and one long-context intake question.

The one runtime failure delivered the correct card, image, URL button, and postback button, but did not finish within the three-response budget. All three iterations remained `thinking_requested`, ending in `LoopExceededError`. This is a completion/batching adherence issue or insufficient budget for that batching; the captured runtime metrics do not include the call arrays needed to reconstruct its exact sequence. It is not evidence of failed component rendering.

**Haiku:** all 288 responses passed native validation, but only 158 met the task checks. Its 130 first-response failures break down into exact greetings (24), exact JSON text (24), silent recovery (24), silent reads (20), worker response shape (19), exact long-context question (18), and intake wording (1). It passed all 24 two-button cases.

Of its seven runtime failures, five involve unsolicited narration around retries, search, or parallel search. Parallel searches themselves ran concurrently. One blocked-service case stopped honestly after one failed lookup where the test expected two; that exact count is stronger than the task's explicit attempt requirement. One requested-update case made three business attempts within a single successful JavaScript iteration, omitted the required updates, and incorrectly said it succeeded on the second attempt. Model-generated catch/retry logic is the likely explanation for that last case; the generated code was not captured in these metrics.

**Gemini:** the matrix has 77 failures: 48 unexpected routes and 29 task/shape failures on Gemini itself. All 48 constructed-history cases (24 prior-result and 24 prior-error cases) fell back to `openai:gpt-5.2-2025-12-11`. The 29 Gemini-served failures comprise long-context wording (12), intake (6), worker response shape (5), Markdown (3), buttons (2), and progress (1). Its button tasks passed 22/24.

Gemini's two runtime failures were four searches instead of the expected two, and a rich-message execution that delivered three copies of the image instead of one. The rich-message execution also switched to OpenAI for its second iteration, so its full behavior cannot be attributed to Gemini alone. Across the original run there were **49 route-mismatch warnings**: 48 matrix responses plus that runtime fallback. The memory/session suite passed 3/3 on the requested route.

## Citation test correction and preserved history

The original runs remain unchanged: Luna **300 passed / 55 failed**, Haiku **194 passed / 161 failed**, and Gemini **246 passed / 109 failed**, each out of 355. The original citation suite passed 24/48 for Luna, 24/48 for Haiku, and 18/48 for Gemini. An overly broad assertion banned `<truncated>` anywhere in the request, affecting all non-compact cases.

In the marker-assertion failures, the preceding assertion had already verified that the entire search corpus was present. An offline reproduction located the marker in an auxiliary `BUSINESS CALL OUTCOMES` preview of the serialized `ThinkSignal`; the actual evidence was intact. The test now retains full-corpus containment and removes the blanket marker ban. Fresh 48-case citation reruns passed completely for Luna and Haiku. These are separate reruns, not retroactively rewritten outcomes. The corpus covers compact evidence and larger inputs of up to 39,305 tokenizer tokens, with scope, revision, joined-source, and arithmetic questions.

## Gemini citations — corrected rerun complete

Gemini's original citation run has **30 failed cases**: 20 explained solely by the marker assertion, plus 10 substantive failures. Five iterations ended in `generation_error`, and five reported a successful exit with no delivered answer. Four of those ten cases were also non-compact and therefore overlapped the marker-assertion issue; these are not additive failure counts. All recorded citation generations used Gemini, so these failures are separate from the fallback cases above.

The fresh corrected rerun passed **39/48**, with no reroutes or cached generations. It retained the same 1,600-output-token request limit and recorded generation metadata and native calls. Its nine failures were:

- Four provider responses with `stopReason: max_tokens` (1,588–1,593 reported output tokens). The runtime correctly rejected them as incomplete, even where the partial text looked plausible.
- One response with `stopReason: other` and 1,541 reported output tokens; the underlying provider cause remains unknown.
- Four completed responses containing only native `listen({})` and no answer text. These are missing answers, not parser failures or completed citation tasks.

The token ceiling demonstrably explains the four `max_tokens` cases. It does not establish the cause of `other` or silent `listen` responses. These baseline observations must not be credited to the later single-tool implementation.

## Local verification and limits

All **522 deterministic tests across 35 files** passed. Package typecheck, lint, formatting, and ESM/CJS/workerd/declaration builds passed. After the citation assertion edit, targeted formatting, lint, package typecheck, and a dedicated typecheck covering that E2E file also passed.

One sample per condition measures this run's behavior, not a reliability guarantee. Native validation is distinct from task success, and these results provide no measured comparison against the old protocol or support for a “90% retained” claim.

## Evidence

The links in this section preserve the preceding broad baseline; current single-tool evidence follows in its own section.

- [Detailed summary and measurements](/tmp/llmz-protocol-after-gemini-results.md), [machine-readable summary](/tmp/llmz-protocol-after-gemini-results.json).
- Original final assertions: [Luna](/tmp/llmz-protocol-after-gemini-luna.json), [Haiku](/tmp/llmz-protocol-after-gemini-haiku.json), [Gemini](/tmp/llmz-protocol-after-gemini-gemini.json).
- Original observations: [Luna](/tmp/llmz-protocol-after-gemini-luna.jsonl), [Haiku](/tmp/llmz-protocol-after-gemini-haiku.jsonl), [Gemini](/tmp/llmz-protocol-after-gemini-gemini.jsonl).
- Corrected citation assertions: [Luna](/tmp/llmz-protocol-citations-corrected-luna.json), [Haiku](/tmp/llmz-protocol-citations-corrected-haiku.json), [Gemini](/tmp/llmz-protocol-citations-corrected-gemini.json).
- [Gemini original log](/tmp/llmz-protocol-after-gemini-gemini.log), [corrected citation rerun](/tmp/llmz-protocol-citations-corrected-gemini.log).
- [Local unit tests](/tmp/llmz-protocol-rerun-unit.log), [build](/tmp/llmz-protocol-rerun-build.log), [citation E2E typecheck](/tmp/llmz-protocol-rerun-citation-e2e-type.log).
- Test source: [protocol matrix](../e2e/protocol-matrix.test.ts), [runtime behavior](../e2e/model-behavior.test.ts), [memory/session](../e2e/native-session.test.ts), [search/citations](../e2e/long-search-citations.test.ts).
- Subsequent design, not evaluated here: [single-tool protocol proposal](native-protocol-single-tool-proposal.md).

## Current single-tool acceptance

After implementation, a separate small suite tested three conditions on each of the same three requested models. Each condition used one fresh sample, no automatic test retries, and a 4,096-output-token limit. The returned decision helpers and normal assistant text were exercised through the real runtime.

| Condition                                              | OpenAI Luna          | Anthropic Bedrock Haiku 4.5 | Gemini 3.8 Flash     |
| ------------------------------------------------------ | -------------------- | --------------------------- | -------------------- |
| Read once and return a typed exit                      | Pass — 1 generation  | Pass — 1 generation         | Pass — 1 generation  |
| Stream assistant text, present two buttons, and listen | Pass — 1 generation  | Pass — 1 generation         | Pass — 1 generation  |
| Inspect the account, then answer from the result       | Pass — 2 generations | Pass — 2 generations        | Pass — 2 generations |

The original nine-case run recorded **6 passed / 3 failed**. All three failures came from the new test incorrectly expecting the text component name `TEXT`; the registered text component renders as `MESSAGE`. Its recorded outputs already showed the exact question, both buttons in order, streamed text deltas, and successful completion. The assertion now derives names from the registered component definitions. Only those three button cases were rerun; the fresh corrected run passed **3/3**, with six unrelated cases skipped. The table combines the six original passing cases with those three corrected cases; it does not rewrite the original run.

Across both runs there were **12 fresh samples and 15 generations**, all on the requested model, with no cached generations, fallback paths, or restarts. Each action generation used exactly one `run_javascript` call; each final inspected answer used normal text with no call. The suite also verified that requests exposed only that native tool with parallel native calls disabled.

Current deterministic validation passed **583 tests across 39 files**, plus all **10 offline semantic matrix-checker tests**. Typecheck, lint, formatting, and package builds passed. The checker executes local fixture programs in the isolated VM, so a tool name in a comment or a forged exit object cannot pass as a completed operation. Its discarded-decision test exposed and verified the fix for the compiler's former implicit trailing-call return.

This is a focused acceptance sample with explicit task instructions, not a broad reliability estimate or a rerun of the 355-case baseline. Gemini supplied the question in one text delta; the live test confirms the delta callback and final delivery, not incremental network timing. Deterministic streaming tests cover execution overlapping an open response stream and preserving completed effects after a later stream failure.

Evidence: [original final assertions](/tmp/llmz-single-tool-live.json), [original observations](/tmp/llmz-single-tool-live.jsonl), [corrected button assertions](/tmp/llmz-single-tool-live-buttons-corrected.json), [corrected observations](/tmp/llmz-single-tool-live-buttons-corrected.jsonl), [current unit tests](/tmp/llmz-single-tool-unit-final.log), [offline checker](/tmp/llmz-single-tool-checker.log), and [live test source](../e2e/single-tool.test.ts).
