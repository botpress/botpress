# Native single-tool protocol: full evaluation

The latest implementation passed **715 unit tests** and **83/83 reference E2E tests**. The three failures from stage four—premature worker failure, undeclared variables, and caught thinking interruptions—also passed in two additional fresh runs each (**6/6**). Formatting, lint, production/E2E typechecks, and build passed. Stage five describes the corrections and their validation; the broader model matrix was not rerun.

The stage-four implementation passed **672 unit tests** and **80/83 reference E2E tests**. Its hook-replacement and rejected-snapshot cancellation cases passed in the full run and in two additional fresh runs each. The three failures exposed by that run remain recorded below.

The preceding version passed **666 unit tests**, **21/21 focused live model checks**, and **81/85 reference E2E tests**. Its four failures remain recorded under stage three. Two of those live cases were subsequently retired at the user's request, and the other two prompted the stage-four corrections.

The original full baseline completed at **918/1218**, and the subsequent returned-decision candidate checks completed at **234/330**. Their remaining failures include omitted content, unwanted narration, ignored examples, and use of JavaScript where ordinary assistant text was explicitly required. Those broader behavioral cases were not all rerun after the final bare-exit-tolerance change.

**Version scope:** the first two stages below cover the implementation where an exit decision must be returned from JavaScript. Stage three also accepts bare `exit()` as terminal; `return exit(...)` remains the canonical form taught in the API, prompts, and examples. Earlier outcomes are not relabelled as validation of that later change.

The original full baseline and the later targeted candidate checks are separate runs. A passing targeted rerun does not replace an earlier failure, and one sample per case is not a statistical reliability estimate.

## Outcomes

| Run                         | Original full baseline | Baseline on the same 82 selected cases | Final candidate selected run |
| --------------------------- | ---------------------: | -------------------------------------: | ---------------------------: |
| OpenAI GPT-5.6 Luna         |                348/378 |                                  73/82 |                        74/82 |
| Anthropic Bedrock Haiku 4.5 |                235/378 |                                  18/82 |                        22/82 |
| Gemini 3.8 Flash            |                267/378 |                                  55/82 |                        60/82 |
| Reference integration suite |                  68/84 |                         Not applicable |                        78/84 |

Cells show passed/executed. The candidate model runs select 48 button/plain-JSON cases plus 34 runtime, example, session, and dedicated single-tool cases. Their additional 240 matrix cases are filtered, not executed. Other baseline suites were not rerun for every candidate model; the 82-case results do not establish a new 378-case full-suite score.

Local returned-decision candidate validation passed **600 unit tests**, plus formatting, lint, and type checks. The promoted bare-exit-tolerance implementation passed **666 unit tests**, formatting, lint, typecheck, and build. Live validation of that version is listed separately below.

| Candidate suite               |  Luna | Haiku | Gemini |
| ----------------------------- | ----: | ----: | -----: |
| Buttons and plain-JSON matrix | 44/48 |  1/48 |  31/48 |
| Runtime/model behavior        | 15/16 | 10/16 |  14/16 |
| Example adherence             |  9/12 |  5/12 |   9/12 |
| Session and memory            |   3/3 |   3/3 |    3/3 |
| Dedicated single-tool runtime |   3/3 |   3/3 |    3/3 |

## Concrete corrections evaluated

- Preserve requested progress-message order for chats using the completed-message handler: the response and accepted message delivery finish before JavaScript starts. Workers and chats with a preview/delta handler still permit execution to overlap the open stream.
- Make worker final-response and prose-recovery guidance require a returned registered exit. Permit an honest incomplete/error payload only when the exit schema supports it.
- Populate the execution-error diagnostic from the mapped stacktrace, preserving the source line and caret.
- Derive button helper typings from the registered schema; show `chat.buttons` arguments as direct button props, and show component-qualified message wrappers only for `chat.present`.
- Describe no-payload exits without a payload argument. Preserve ordinary assistant-text examples for native text and speech components.
- Migrate stale reference expectations to the single-tool lifecycle. Model-quality assertions were retained; failures below have not been converted into passes by loosening their expectations.

## What the results establish

### Native protocol, schema validation, and memory

All three baseline matrix runs accepted all 288 native envelopes each. The baseline runtime rejected one Luna presentation and 46 Haiku helper calls because their generated arguments violated the documented helper contracts. The largest Haiku patterns were 23 wrapped-props button calls and 23 attempts to put a JSON answer in a no-payload listen exit.

All three completed candidate matrix runs accepted all 48 native envelopes per model and recorded **zero runtime/schema rejections**. Each used the exact requested model, with no provider cache hits. This establishes that the selected samples used valid calls; it does not establish that they fulfilled their tasks.

All 24 typed-worker cases and all 24 silent save-and-exit cases passed for all three models in the full baseline. Their dedicated single-tool and session/memory suites passed again in the returned-decision candidate runs.

### Remaining candidate failures

**Luna: 8 failed tests out of 82.** Four button cases failed: one omitted the buttons, two omitted the required question, and one used a different question. All 24 plain-JSON cases passed. Two examples failed uppercase style, one omitted the example-driven progress announcement, and one unavailable-service scenario completed before the test's prescribed final response.

**Haiku: 60 failed tests out of 82.** The API guidance corrected argument shape, but did not solve overall adherence:

- All 24 button cases delivered the correct two `say` buttons and completed through listen. Only one also delivered the required question; the other 23 remain failures.
- Twenty-one of 24 JSON cases delivered the exact JSON through `chat.present`, violating the explicit ordinary-assistant-text requirement. Two silently exited. One narrated its intent without sending the JSON. All 24 remain failures.
- The other failures concern unwanted progress/narration, uppercase style, ignoring sequential-call overrides, or catching/retrying inside JavaScript when instructions required one propagated call per response.

**Gemini: 22 failed tests out of 82.** Seventeen button cases delivered the correct buttons but omitted the required question; all 24 JSON cases passed. Three example cases missed uppercase style or the demonstrated announcement. One runtime case repeatedly called an unavailable service until exhausting its three-response budget without an answer. The other returned the correct answer with the required retry updates, but recorded three execution-error iterations where the test expects two. Its aggregate log does not include the generated code or individual error details needed to attribute that extra error to the model or runtime.

For the selected matrix, Luna satisfied structural checks in 45/48 cases and exact task checks in 44/48. Haiku satisfied both in 1/48; Gemini satisfied both in 31/48. These checks intentionally include more than native-call validity. In some task kinds, the shape checker also includes content requirements; it is not a pure schema-validity metric.

No new VM defect is established by these remaining candidate failures; the extra Gemini execution-error status remains diagnostically unresolved. The observed wrong helper arguments were correctly rejected in the baseline; the misleading API descriptions that encouraged them were an implementation issue and have been corrected.

### Full baseline findings outside the targeted rerun

Luna and Gemini each passed 48/48 long-search/citation cases; Haiku passed 47/48. Haiku's one citation-case failure was arithmetic: it answered `1151 - 160 = 941`, instead of 991. Retrieval evidence, required citations, and the expected two-iteration lifecycle remained intact.

All three models passed all eight plain-response protocol-adherence cases. Baseline matrix failures also included exact wording, unwanted narration, and bare JavaScript expressions where a returned inspection value was required. Eight Luna Markdown cases delivered the requested fenced code but failed the explicit native-text-only requirement because they also used JavaScript.

The reference baseline's 16 failures were classified as eight stale expectations, seven model-behavior failures, and one execution-error stack diagnostic defect. The final returned-decision candidate passed **78/84**, including all snapshot cases (4/4), voice cases (12/12), and checker cases (10/10). Its six failures involved undeclared variables, bypassing a required special calculator tool, calling `sync`/`async` instead of the declared `syncTool`/`asyncTool` names, catching an intentionally invalid schema write rather than letting its error propagate, and repeatedly calling `exit()` without returning it. The sync/async fixture contains an existing naming ambiguity. The caught schema error is not evidence that validation accepted the invalid value. The missing-return exit behavior is relevant to the new bare-exit tolerance, whose validation is separate; `return exit(...)` remains the canonical form.

## Routing and full Gemini baseline

The Luna baseline matrix included one unexpected fallback to GPT-5.2, in streaming English progress. That sample also failed task behavior and is counted once. Haiku's baseline matrix used the exact requested Bedrock model in all 288 cases. All 144 candidate matrix records used their requested models. All three models’ example records were also checked independently for routing and provider cache hits, since example-adherence does not itself assert route equality.

Gemini's full baseline passed **267/378**, including 186/288 matrix cases. All 288 native envelopes were valid, with no matrix VM errors. Exactly 48 cases used GPT-5.2 after Gemini: synthetic `tool-result` and `recovery` history, across every language and delivery mode. All 48 fallback responses met the task checks, but correctly failed the requested-model assertion. Provider warnings disclose only that the original model failed or was unavailable; they do not establish why. Real session and citation continuation tests passed independently.

The other 54 matrix failures were 17 embellished long-context questions, 18 omitted button questions, two intake answers delivered through JavaScript instead of native text, and 17 Markdown cases. The Markdown failures comprise eight silent exits, eight `max_tokens` stops, and one `other` stop. All nine abnormal-stop responses had no tool call, so these were not malformed generated JavaScript. Gemini warns that `reasoningEffort: none` is unsupported and uses its default thinking configuration; the fixed 1600-token probe budget is relevant to interpreting these stop outcomes. Seven abnormal-stop responses satisfied the shallow content checks, but the outer stop-reason assertion correctly prevented them from passing.

The returned-decision reference cache records 128 completed requests: 117 Luna, nine Bedrock Haiku, and two Gemini 3 Flash. All requested cache bypass and reported `cached=false` with empty fallback paths. The nine Haiku calls explicitly named the Anthropic route and returned the corresponding Bedrock route. This backend-name difference is reported separately; the reference suite is not a pure Luna evaluation.

## Stage three: bare-exit tolerance

The later implementation continues to teach `return exit(...)`, while accepting an omitted `return` as a terminal control operation. This addresses the missing-return failure mode without changing the canonical examples. These checks use a separate frozen source snapshot and separate artifacts; no earlier result is overwritten.

| Focused final-version run                               | Passed/executed | Status |
| ------------------------------------------------------- | --------------: | ------ |
| Luna: four single-tool cases plus three session cases   |             7/7 | Final  |
| Haiku: four single-tool cases plus three session cases  |             7/7 | Final  |
| Gemini: four single-tool cases plus three session cases |             7/7 | Final  |
| Reference suite, including the added checker regression |           81/85 | Final  |

The four model cases exercise one-generation typed completion in both delivery modes, buttons, and inspection. The final live test teaches canonical `return exit(...)` and permits either source form; 44 deterministic API tests cover forced bare and returned forms separately. These are focused checks of the changed control flow, not another complete 378-case model run. All 21 canonical-form live checks passed on the promoted original workspace, with no recorded route warnings. These results do not measure whether every model will voluntarily choose bare exit.

The stage-three reference run passed chat 15/15, worker 15/16, general runtime 25/27, voice 12/12, snapshots 3/4, and checker 11/11. Its four failures were:

- The model bypassed a required special calculator tool and answered 5 instead of the fixture's tool-produced 666.
- The invalid schema assignment was correctly rejected, but generated code caught the error and completed; the test expects an uncaught execution error. This does not show that validation accepted the invalid write.
- The modified-code hook and tool execution completed correctly, but the final upstream Luna response contained no text or calls despite metadata reporting 51 output tokens and a normal stop. The available trace establishes an empty generation response, not its provider/adapter root cause.
- A rejected snapshot resumed with the rejection and memory intact, but the model gave an apology and listen completion instead of the required typed cancel exit. The purchase was not replayed.

All 123 recorded stage-three reference requests requested fresh responses and reported `cached=false`, with no fallback path or restart: 114 Luna, seven Bedrock Haiku, and two Gemini 3 Flash. The Anthropic-to-Bedrock route-name difference is again kept distinct from an explicit fallback.

The initial live attempt explicitly required the model to omit `return`. It recorded Luna 5/7, Haiku 7/7, and Gemini 7/7. Luna's two failures were solely the source-shape prohibition: both responses used canonical `return exit(...)`, returned the correct typed value 17, and completed with one generation and one business read. Those two remain recorded failures of that initial test. The test was corrected to match the user's canonical-form preference, and the separate canonical rerun passed 7/7 for each model. Runtime/API source was identical between those attempts; only the live fixture changed. This is not stronger evidence of bare-source generation. The deterministic tests force bare exit, and the initial Haiku/Gemini runs did generate it successfully. No initial outcome has been relabelled.

## Stage four: hook feedback and typed cancellation

The two disputed live cases were removed at the user's request: the seeded calculator case requiring `2 + 3 = 666`, and the schema case requiring a correctly rejected assignment to escape uncaught. Their earlier failures remain in the historical 81/85 result above. Deterministic tests still enforce actual error recovery, schema rejection, unchanged invalid properties, and validation before business calls. The reference suite now contains 83 tests.

### Empty response after a code-replacement hook

The failing assistant call requested `original()` followed by `exit('done', result)`. The host hook replaced it with `modified()` and a plain inspection return. Native history retained the requested program, but its tool result reported only the returned value and created variable; it did not disclose that the original program and its exit never ran.

Three paired uncached Cognitive probes replayed this captured continuation, pinned to the same Luna model. Original feedback produced an empty normal stop in all three samples. An explicit replacement/no-exit explanation produced a tool call in all three, although one repeated `original()` instead of using the retained result. This supports the missing-disclosure diagnosis; output-token metadata alone does not explain a provider's hidden reasoning.

The implementation now preserves the original native assistant call while reporting a bounded replacement-source preview, actual business-call outcomes, and whether completion occurred. Nonterminal feedback tells the model to use the recorded result without replaying the original program to compensate for the host change. Persisted snapshots preserve the disclosure. No automatic execution retry, fabricated exit, or additional model-response budget was added.

### Cancellation after a rejected snapshot

The failed continuation already contained the rejected payment outcome, preserved memory, and registered cancellation schema. The model produced apology text, which ordinary chat semantics correctly completed through `listen`. The protocol instructions now explicitly prioritize a registered task exit when the known outcome matches its description, even alongside assistant text. The runtime does not guess a cancellation payload or map all rejected snapshots to cancellation.

The original live business instructions and exit assertions remain unchanged. Each resolved/rejected snapshot test branch now has an independent chat transcript, stored as plain text. Branch contamination did not cause the captured failure, but isolation prevents one branch from influencing another. A deterministic regression verifies rejected settlement, retained memory, typed cancellation alongside text, and no repeated payment or purchase.

Local validation passed **672 unit tests across 44 files**, production and E2E typechecks, lint, formatting, and build. Two fresh targeted runs passed both repaired cases (**4/4**, no test retries). Each hook case completed within its existing two-response budget; cancellation required one response after resumption. All ten recorded generations in those targeted runs used uncached Luna responses with no fallback or restart. These small samples do not establish a universal model success rate.

The separate full reference rerun passed **80/83**: chat 15/15, worker 15/16, general runtime 23/25, voice 12/12, snapshots 4/4, and checker 11/11. Both repaired cases passed again, making **3/3 fresh samples for each**. All 118 recorded generations requested fresh responses, with zero cache hits, fallback paths, restarts, or empty responses: 108 Luna, eight Bedrock Haiku, and two Gemini 3 Flash. The broader model matrix was not rerun.

Three other cases failed in this new run. They remain failures rather than being removed or weakened:

- Worker file-error recovery: generated code caught a file-lock error and immediately exited with `{ success: false, ... }`, leaving the locked files undeleted. It did not call the available process-closing tool despite eight responses remaining. Its initial request was identical to the earlier passing run; the failed sample chose a different recovery strategy.
- Variable persistence: Luna assigned `orderId` without declaring it in each of the first two responses, correctly causing `ReferenceError`. It declared the variable and completed on the third response. The fixture fails its first-iteration assertion; this does not establish lost retained memory. The initial request was identical to the previous passing run, which declared the variable immediately.
- Dynamic model/temperature: temperature changed correctly from `0.5` to `1.0`, but the second response caught a `ThinkSignal`, called the tool again inside a loop, and completed in two responses instead of the expected three. Unlike terminal exit, a thinking interruption can currently be caught by generated code. This exposes an existing interruption-control gap against the prompt's stop guarantee; it is not a failure to apply the dynamic settings. The previous passing run used uncaught calls and took three responses. This separate gap remains unresolved by the hook/cancellation changes.

## Stage five: interruption control, declarations, and recovery

The three failures from stage four were addressed without removing cases, weakening E2E assertions, or increasing their response budgets.

- **Interruption control:** real host `ThinkSignal` and `SnapshotSignal` interruptions now latch outside generated JavaScript. Both VM engines block generated catches, finalizers, later mutations, and new host calls after interruption. Already-started operations are joined. Dynamic model and temperature settings are recalculated for the next response, with the original thinking reason/context preserved. Ordinary business errors remain catchable.
- **Snapshot ownership:** a late snapshot from already-started work survives an early program return or proposed exit. Its promise binding is not fabricated into a resolved value. A stable inner-call ID ties assignment metadata to the first interrupting operation even when another identical operation also interrupts. The snapshot contract still represents one interruption; this does not add aggregation of multiple external jobs.
- **Declarations:** prompts explicitly require top-level `const` or `let` for new retained variables. Reference-error feedback points to Memory/API and acknowledged results, so fixing a failed assignment does not require repeating a completed operation. Both VM engines preserve the original error category through wrapping and serialization; ordinary errors with the exact text `record is not defined` do not trigger this guidance. Invalid JavaScript is still rejected.
- **Recovery:** the default worker completion description and protocol guidance distinguish a recoverable operational error from a terminal failure. Models are instructed to address known, authorized remedies and retry failed work without replaying successful actions. Legitimate failure exits remain available when recovery is forbidden, unsafe, unavailable, or exhausted. This remains model guidance rather than a runtime determination of arbitrary business recoverability.

Local validation passed **715 unit tests across 48 files**, production and E2E typechecks, lint, formatting, and build. Regression cases cover both VM engines, caught/finally interruptions, pending sibling work, late snapshots, persistence/resume, dynamic settings, declared-variable reuse, exact-message error classification, and valid failure completion when retries are prohibited.

The fresh full reference run passed **83/83**: chat 15/15, worker 16/16, general runtime 25/25, voice 12/12, snapshots 4/4, and checker 11/11. Two additional fresh targeted runs passed all three repaired cases (**6/6**, with 38 unrelated cases filtered in each run). Each repaired case therefore passed in three fresh samples with no test retries or increased response budgets. These small samples validate the observed fixes without establishing a universal model reliability rate. The broader model matrix was not rerun.

All 120 recorded reference generations requested fresh responses and reported no cache hits, fallback paths, stream restarts, or empty completions: 111 Luna, seven Bedrock Haiku, and two Gemini 3 Flash. The explicit Anthropic requests resolved to the corresponding Bedrock backend. The two targeted runs added 17 fresh, uncached Luna generations, also without fallback, restart, or empty completion.

## Methodology and artifacts

Final Vitest JSON is authoritative for outcomes. Structured logs/JSONL provide diagnosis. A runtime `success` field or a recorded answer is not a passed test; assertions may still fail afterward. Missing records do not remove failures from denominators. Diagnostic categories may overlap within one failed test.

The full matrix covers 12 task kinds, 12 languages, and both streaming/nonstreaming delivery. Its generated JavaScript is replayed against local fixture tools to inspect actual effects. Matrix streaming samples are collected before this replay; early execution, stream joining, and failure settlement are covered by separate runtime regressions. Synthetic prior-tool histories are distinct from real session continuation.

Runs use fresh responses, one sample per case, and no test retries. SDK transport retries are separate. Comparing the two 82-case samples is informative but does not isolate causality or establish a stable improvement rate. Earlier evaluations used a weaker matrix checker and an overbroad citation-truncation assertion; their overall scores are not directly comparable.

Artifacts:

- Original full baseline: `/tmp/llmz-full-single-tool-{luna,haiku,gemini,reference}.{json,jsonl,log}`. Reference request metadata is in the separate `.cache.jsonl` file.
- Final candidate targeted runs: `/tmp/llmz-validated-single-tool-{luna,haiku,gemini}.{json,jsonl,log}`; final reference artifacts use the matching `reference` prefix.
- Bare-exit-tolerance initial omission-specific probes and final reference: `/tmp/llmz-exit-control-{luna,haiku,gemini,reference}.{json,jsonl,log}`, plus reference `.cache.jsonl`.
- Final canonical-form probes: `/tmp/llmz-exit-canonical-{luna,haiku,gemini}.{json,jsonl,log}`. The omission-specific and canonical attempts use the same runtime source and different live source-shape expectations.
- Read-only summaries: `/tmp/llmz-full-single-tool-summary.json` and `/tmp/llmz-validated-single-tool-summary.json`, generated by `/tmp/llmz-full-single-tool-summary.mjs` with the corresponding prefix.
- Intermediate reference verification: `/tmp/llmz-fixed-single-tool-reference.json`, **57/62**. It predates the final validated candidate and is not merged into either final table.
- Earlier guidance-only attempts for Luna and Haiku selected **zero tests** because the filter did not match. Their 288 pending entries provide no model-quality evidence.
- Hook diagnosis paired probes: `/tmp/llmz-hook-continuation-replay.{jsonl,log}`. These are generation-only diagnostics; generated business calls were not executed.
- Hook/cancellation targeted reruns: `/tmp/llmz-hook-snapshot-focused-{1,2}.{json,log,cache.jsonl}`.
- Hook/cancellation reference rerun: `/tmp/llmz-hook-snapshot-reference.{json,log,cache.jsonl}`.
- Stage-four local verification: `/tmp/llmz-hook-snapshot-{unit,type,e2e-type,lint,format-check,build}.log`.
- Interruption/declaration/recovery reference and targeted reruns: `/tmp/llmz-recovery-reference.{json,log,cache.jsonl}` and `/tmp/llmz-recovery-focused-{1,2}.{json,log,cache.jsonl}`.
- Stage-five local verification: `/tmp/llmz-recovery-{unit,type,e2e-type,lint,format-check,build}.log`; source hashes are recorded in `/tmp/llmz-recovery-source-manifest.json`.
