# LLMz native-message protocol

Status: implemented for the 1.0 major version. The [validation report](native-protocol-rerun.md) separates the preceding broad multiple-native-tools baseline from targeted single-tool acceptance. The three targeted conditions passed on Luna, Haiku, and Gemini after correcting a test fixture's component-name assertion. Broader rollout and comparative performance remain validation work.
Date: 2026-09-18.

This document describes the implemented runtime contract. See the [migration guide](native-protocol-migration.md) for integration changes and [public API guide](../DOCS.md) for usage.

## Goal and scope

LLMz uses normal assistant messages, native tool calls, and matched tool results. It retains JavaScript orchestration, selective result inspection, captured variables, object bindings, iterative recovery, snapshots, hooks, and observability.

Retaining at least 90% of the useful capabilities is a product target, not a measured result. Capability coverage, model task success, cost, and latency require separate evaluation. Deterministic tests establish runtime behavior; they do not establish provider success rates.

This is a clean major-version design. There is one model-facing protocol, with no legacy marker parser or compatibility execution path.

## Model-facing contract

`run_javascript({ code: string })` is the only provider-native tool. A response may contain at most one call, with provider tool control set to `parallel: false`. Ordinary assistant text, including provisional text streaming, remains native.

| Intent                             | Interface                                      | Outcome                                                           |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| Reply or ask a question            | Normal assistant text                          | Finish naturally when the successful response has no calls        |
| Execute and inspect data           | JavaScript `return inspect(value)`             | Preserve the value, report it, and request another model response |
| Return ordinary data               | JavaScript `return value`                      | Same nonterminal inspection behavior                              |
| Present rich messages and wait     | JavaScript `return chat.present({ messages })` | Deliver the validated batch and finish with `ListenExit`          |
| Present buttons and wait           | JavaScript `return chat.buttons(buttons)`      | Present the buttons and finish with `ListenExit`                  |
| Send progress while continuing     | JavaScript `await chat.send(messageOrArray)`   | Deliver nonterminal messages in program order                     |
| Wait silently                      | JavaScript `return exit()`                     | Finish the chat turn                                              |
| Complete a worker or typed handoff | JavaScript `return exit(name, payload)`        | Validate the registered exit payload and return the typed result  |

Presentation entries use `{ component, props?, body? }`. Component names resolve against registered components and aliases; schemas and renderers remain authoritative. Keeping displayed `body` separate avoids collisions with a component's own `props.body`. Normal text should ordinarily use assistant messages, and text-only chat needs no registered text component.

Exit payloads are passed directly, including primitives, arrays, and objects: `exit('total', 42)` needs no native object wrapper. Payloads must be JSON-compatible. Omit the payload for an exit without a schema; use `z.null()` for explicit null. `z.undefined()` and `z.void()` are rejected as exit schemas.

`return exit(...)` is the recommended completion form. The `exit(...)` call itself is terminal control flow, so it also stops JavaScript if `return` is omitted. The first valid exit wins, including from a nested helper, and surrounding catch/finally blocks do not continue the program. Invalid names or payloads still raise ordinary validation errors. `inspect`, `chat.present`, and `chat.buttons` construct opaque decisions that take effect only when returned. Discarding a presentation decision does not deliver messages, and an ordinary object cannot forge a decision. Required named-memory settlement occurs before terminal presentations or exits. `inspect` unwraps its value into ordinary result memory; terminal receipts do not replace `$return`.

Exit control flow applies to compiled VM programs, including their declared functions and callbacks. Dynamically generated source (`eval`, `Function`, and related constructors) is unsupported; compiler checks reject recognizable forms. These checks are not a security boundary for reflective code, and the Node fallback remains unsandboxed.

For a presentation with a custom exit, return `chat.present({ messages, exit: { name: "done", payload } })`. Its `exit` field is a plain descriptor, not a call to `exit(...)`; calling the function there would stop before the presentation is constructed. Await all business work before requesting completion. Started but unawaited work is joined and reported as an execution error, rather than silently completing.

System instructions contain the task, execution rules, TypeScript declarations for callable business functions and object methods, presentation and exit schemas, and labeled examples. Generated programs are JavaScript with top-level `await` and `return`; type annotations, imports, and JSX are not executable response syntax. Business functions are not duplicated into the native tool list. Object property schemas, values, and access rules appear in Memory, and conversation history stays in native messages.

The execution tool uses the portable JSON object input `{ code: string }`. Provider-specific raw-string tools are outside this baseline.

## Representative interactions

### Ordinary answer

```text
user: Hello
assistant: Hello!
[runtime returns ListenExit]
```

One model inference, no VM invocation, and no explicit exit call.

### Read, inspect, answer

```text
user: What plan am I on?
assistant call c1: run_javascript({ code: "return await readAccount()" })
result c1: RETURN { plan: "Pro", projects: 17 }
assistant: You are on Pro, with 17 projects.
```

Two model inferences. Business calls can chain or use `Promise.all` inside JavaScript without intermediate model inferences.

### Present choices and wait

The assistant streams “Which plan would you like?” normally and makes one `run_javascript` call:

```js
return chat.buttons([
  { action: 'say', label: 'Standard' },
  { action: 'say', label: 'Pro' },
])
```

The runtime validates the program's decision, settles memory, delivers both buttons in order, and returns `ListenExit`. One model inference suffices; the matched outer tool result stays in history for the next user turn.

### Compute and complete a worker

```js
const report = await calculateReport()

return exit('report_completed', { total: report.total })
```

The program uses the actual business result and finishes with a typed payload in one inference. Use `return inspect(report)` when another model response must interpret the result before deciding what to do.

### Recover after partial execution

```js
const account = await readAccount()

return await updateAccount(account)
```

If the update fails after the read succeeds, the result reports the interruption and retained `account`. The next program can call `updateAccount(account)` directly. LLMz does not automatically rerun the successful program prefix.

## Iteration and batch lifecycle

An iteration contains one logical model generation and its JavaScript execution, which may overlap. Provider retries before execution are attempts within that iteration. Inner business calls have their own trace identities, correlated with the outer native call.

1. Resolve instructions, business tools, objects, components, exits, and budgets.
2. Build native history and the tool catalogue; compact complete settled groups if context fitting requires it.
3. Generate the response, exposing provisional text previews when supported.
4. Validate a complete structured native call. Workers and chats with `onMessageDelta` may start its program while the response stream remains open. Never execute partial arguments.
5. Wait for streaming and any started JavaScript to settle. Record the assistant response and deliver accepted text after successful generation. For chats without `onMessageDelta`, await acceptance of accompanying text by `Chat.handler` before starting and settling JavaScript.
6. Resolve the requested exit or returned decision, settle required memory, then dispatch terminal presentation or completion.
7. Record the matched outer result, including failure or interruption, and finish, suspend, or generate the next response.

A response contains at most one `run_javascript` call, and it must be the sole native call. Assistant text may accompany it. That text cannot inspect an unseen tool result; use `chat.send` for messages whose contents depend on operations within the program.

A returned `chat.present` decision contains an ordered presentation batch that finishes with `ListenExit`. Validate every item before delivering any item; settle named memory before terminal effects. Deliver components sequentially and apply the exit only after all required deliveries succeed. `chat.send` is explicitly nonterminal and can deliver progress earlier in the program; those acknowledged effects remain completed if later code fails.

An invalid batch observed before dispatch executes no calls. Each identifiable rejected call receives correction feedback. Previously streamed previews can already have been visible, so the runtime sends a restart delta to retract rejected provisional text when a preview handler exists. If the adapter adds or changes calls after dispatch, the iteration fails without replaying the program or erasing completed effects.

If a delivery fails, remaining calls are skipped and the exit is withheld. Earlier acknowledged deliveries remain completed. A failed handler may have made external progress before throwing; its outcome is reported as uncertain, without a promise of exactly-once transport delivery.

## Completion, errors, and thinking

A successful nonempty text-only chat response finishes through `ListenExit`. Empty output alone does not request silent completion; the model receives correction feedback within the remaining response budget. A worker must use an available typed exit. Exhausted budgets return an error and never fabricate completion data.

Worker guidance distinguishes an operational error from a terminal failure. Address known causes using available, authorized recovery and retry only failed work. Failure exits remain valid when recovery is unavailable, unsafe, forbidden, or exhausted, and task-specific terminal outcomes take precedence. This is model guidance, not a runtime guarantee that arbitrary business failures are recoverable.

Chat instructions prioritize a registered task exit when the known outcome matches its description. Assistant text can accompany that call, but prose alone does not select an application exit. `ListenExit` remains appropriate when waiting for the user or when no registered task outcome matches; the runtime does not infer a cancellation payload from an apology or a rejected snapshot.

Every nonterminal call receives a result and normally causes another model response, including successful JavaScript returning `undefined` or an `inspect(value)` decision. An `exit(...)` call validates its payload, stops the program, and requests completion after memory settlement and `onExit`; hook rejection produces feedback for correction. An unreturned presentation decision has no terminal effect. Terminal completion still records a matched result, but does not request another model response. Failures before a native call exists use runtime context rather than invented tool-result IDs.

Partial calls and failed responses never authorize new execution. Before dispatch, a failed, truncated, filtered, or abandoned generation discards its provisional calls. Once a complete call has started, later stream failure or restart ends the iteration without automatic fallback or replay; already completed effects and retained memory remain available. The runtime waits for the program to settle before returning that failure.

`ThinkSignal` interrupts the program and gives the next model response its reason/context. A host-thrown `ThinkSignal` or `SnapshotSignal` stops generated JavaScript even inside `try/catch/finally`; later callbacks, mutations, and new host calls are blocked. Already-started host operations settle before another response or snapshot is returned. Captured prefix memory and snapshot assignment ownership remain available. Ordinary tool errors remain catchable. Provider reasoning is separate from visible assistant text; required opaque continuation data is retained for the adapter.

The compiler, VM, tool wrappers, line tracking, hooks, retries, and cancellation remain in use. This protocol change does not strengthen VM isolation. QuickJS and the Node fallback retain their documented runtime limitations.

If `onBeforeExecution` changes the program, execution feedback includes a bounded preview of the replacement, recorded business-call outcomes, and the actual completion state. The original assistant call and provider continuation fields remain unchanged. Snapshot settlement preserves the replacement disclosure too. An exit present only in the original source has no effect.

## Session ownership and native history

`Session` owns canonical native messages, exact memory, stable counters, and persistence. Reuse one session across user turns; serialize with `session.toJSON()` and restore with `Session.fromJSON()`.

```typescript
const session = new Session()

const first = await execute({
  client,
  chat,
  session,
  messages: [{ role: 'user', content: 'Remember my account.' }],
  tools,
})

if (first.isSuccess()) {
  await execute({
    client,
    chat,
    session,
    messages: [{ role: 'user', content: 'Use that account again.' }],
    tools,
  })
}
```

`messages` supplies new native input. A host `Chat.transcript` can alternatively supply its conversation projection. Exact delivered assistant text is reconciled against canonical output to avoid duplication. Explicit messages take precedence over transcript ingestion; applications should choose one input owner. Native messages alone cannot recover memory omitted from inspection previews.

One session permits one execution at a time. New input is rejected while a native call is pending. Call IDs are unique within retained history, completed calls have one matched result, and restore validates group/counter identities and their retained memory entries.

Image/audio attachments retain their original turn. Events and summaries are labeled input records rather than higher-priority instructions. Provider roles/content blocks remain the adapter's responsibility. Audio-capable paths can preserve audio input; other paths use configured transcription.

Custom adapters may return a complete `assistantMessage` and opaque `continuation`. Normalized calls and visible output must agree with the supplied assistant message. Native messages/continuation use JSON-compatible data, with signatures encoded as strings when necessary. Adapters must consume that representation on subsequent requests; preserving it locally does not prove every provider service forwards it correctly.

Cross-provider continuation compatibility remains part of deployment validation. Opaque provider state is not assumed portable.

## Explicit JavaScript memory

| Surface                                     | Purpose                                                    | Lifetime                                                                    |
| ------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| Named variables such as `account`           | Reuse explicitly captured data                             | Same session; survive transcript compaction                                 |
| `$return`                                   | Latest successful JavaScript result                        | Until replaced, made unavailable, or its originating iteration is compacted |
| `$iterations[n].result`                     | Result of the nth retained settled iteration, newest first | While that iteration remains retained                                       |
| Object properties such as `account.profile` | Schema-governed host state                                 | While the corresponding host object is configured                           |

Memory describes actual bindings supplied to the next VM call. Previews are display summaries, never replacements for stored values.

New retained variables require a top-level `const` or `let` declaration. Assigning an undeclared name remains an error; the runtime does not invent a global binding. Reference-error feedback points to Memory and the documented API, and preserves acknowledged business results so a failed assignment can be corrected without replaying the operation.

### Supported values and capture

Stored data supports plain objects, dense arrays, strings, finite numbers, booleans, null, and undefined, including undefined nested in collections and negative zero. Cycles, functions/closures, big integers, non-finite numbers, dates, maps/sets, class instances, symbols, accessors, non-enumerable data, sparse arrays, and custom array properties are unavailable captures. Convert them to supported data explicitly.

The default serialized memory budget is 16 MiB, configurable through `Session({ maxBytes })` or `Memory({ maxBytes })`. The budget covers retained variables, results, object properties, and metadata. A preflight reserves settlement metadata before effects begin; oversized captures are reported without replaying completed actions. History is materialized within this budget; lazy backing storage is not implemented.

The compiler captures supported top-level declarations, including destructuring. Function parameters and block-local declarations do not become session globals. Captured values are reinjected into later executions; a prior `const` does not preserve its lexical declaration or object identity across calls. The next program may update or redeclare its named state. This is data persistence, not an arbitrary live JavaScript heap.

Partial failures preserve eligible values captured before interruption. A failed or unsupported replacement is reported unavailable instead of presenting an old value as the new result. Runtime names `$return` and `$iterations` are reserved and excluded from ordinary capture.

### Return binding

```js
const account = await readAccount()

return { account, count: 3 }
```

The following execution can read `account`, `$return.account`, and `$iterations[0].result.count`. Returning an object never spreads its keys into globals.

`$return` starts as undefined. It changes only after successful JavaScript settlement, including a successful undefined return. Errors, text, component calls, exits, and thinking/snapshot interruptions do not replace it. A successful result that cannot be retained clears the latest-result reference and reports the capture failure. Compacting its originating iteration clears it without retargeting an older result.

Programs use ordinary explicit returns. The existing compiler also awaits returned expressions and treats a final call or awaited-call expression as the return value. Other programs that reach the end return undefined.

### Newest-first history

`$iterations` is an immutable array of retained settled model iterations. The current execution is not included. Positions are fixed throughout one invocation and shift after settlement:

```js
$iterations[0] // Latest settled iteration
$iterations[1] // Previous iteration
$iterations[100] // 101st most recent iteration, if retained
$iterations.slice(0, 100) // Up to the 100 most recent iterations
```

The implemented entry type is:

```typescript
type IterationMemory = {
  id: string
  number: number
  turn: number
  turnId?: string
  timestamp: number
  outcome: string
  error?: string
  hasResult: boolean
  result?: MemoryValue
  unavailable?: string
}
```

Stable IDs and numbers do not reset across turns or compaction. Text, presentation, exit, failed, and interrupted iterations occupy positions with `hasResult: false`. A captured successful undefined result has `hasResult: true`. Check that flag before reading a result. Out-of-range access returns undefined. Provider retries do not add entries, and the view does not embed full transcripts or provider reasoning.

`$return` and historical values are deeply immutable snapshots. Editing a separate named variable cannot rewrite old results. To keep a useful subset after compaction:

```js
const savedAccount = $return.account
```

Named state persists independently within the same memory budget. `Session.compact(retainedIds)` removes complete old groups and their automatic memory entries together. It preserves named bindings and rejects removal of pending groups. Context fitting may compact old settled groups automatically.

### Object properties

Only callable object methods appear in the system API section. The Memory inventory lists object property access paths, values, schemas, and read-only/writable status.

Property reads return deeply immutable snapshots in both VM drivers. Writable properties change through whole-property replacement, which invokes their schema validator:

```js
account.profile = {
  ...account.profile,
  age: 42,
}
```

Nested writes are rejected, even on writable properties. Read-only properties reject replacement too. Unchanged host input preserves a successful VM override; changed host input is authoritative and replaces it. Rebuilding unchanged objects preserves provenance. Restored object inventory remains inactive until the corresponding objects are configured again.

### Provenance

A turn starts with a new accepted execution input or worker invocation. Internal model roundtrips and snapshot resumption without new input remain in that turn. Each iteration has a stable session number and records its turn ID/number and timestamp.

Named bindings retain creation, successful assignment, and observed-update provenance. Equal-value reassignment is still an assignment. Failed right-hand sides are not successful writes. Reads, reinjection, rendering, compaction, and restoration do not refresh assignment age.

Nested edits to ordinary named objects/arrays are updates. Instrumented writes record their execution time; changes through aliases or methods can be detected at settlement and are labeled as observed updates. These changes do not rewrite the binding's previous assignment time. Host-property replacement has its own mutation trace and provenance; unknown initial host ages remain unknown.

Relative ages are computed when assembling the request, using one reference time, with nonnegative elapsed ages and stable turn counters. `Set just now` describes assignment, not when external data was fetched.

## Memory reports and request footer

Every JavaScript result contains a bounded return preview and retained changes. For example:

```text
RETURN
{ account: { id: "acct_7", plan: "Pro" }, count: 3 }

CREATED
- account: { id: "acct_7", plan: "Pro" }

UPDATED
- email: "sam@example.com"
```

Interrupted executions report that later statements did not run and include bounded business-call outcomes for recovery. Unsupported captures appear under `MEMORY UNAVAILABLE`. Repeated writes are coalesced by binding; created/updated lists and business-call outcomes are bounded. Object replacements use paths such as `account.profile`.

The report belongs to the native tool result and remains canonical history. Its metadata never becomes part of the underlying `$return` value. It does not use relative history indexes that would become stale.

A fresh overview is appended to the final eligible input for each request:

```markdown
## Memory

Available in JavaScript. Previews are abbreviated; historical results are read-only.

### Variables

- `account`: { id: "acct_7", plan: "Pro" } — set just now (this turn).
- `currency`: "CAD" — set 1 minute ago (2 turns ago).

### Object properties

- `settings.locale`: "en-CA" (string; read-only) — age unknown.

### Results

- `$return` (also `$iterations[0].result`): { account: { … }, count: 3 } — returned just now (this turn).
```

The overview uses plain Markdown and useful access paths, scalar/shape previews, and relative ages. Named bindings are ordered by recent change; results are newest first with their actual history indexes. Empty sections and entries without results are omitted. Large inventories report omitted entries. The default overview budget is 6,000 characters.

The footer is request-local inside `<runtime-memory>` delimiters. Canonical user text, tool results, and signed assistant content are preserved. During tool continuations it is appended to the final tool result. When history ends with assistant output, a new labeled runtime-context input carries it. Old overviews are not stored in canonical history.

## Snapshots

Native snapshots contain a versioned session, the unresolved `run_javascript` call ID and code, interrupted business-call context, and exact supported memory/provenance. Persist with `snapshot.toJSON()` and restore with `Snapshot.fromJSON()`.

While a snapshot is pending, new input and another execution of its unresolved session are rejected. The host first resolves or rejects the snapshot. Resumption adds one matched outcome for the suspended native call, then lets the model generate continuation code. This does not restore a JavaScript instruction pointer or imply that the remaining program ran.

Resolution restores supported assignment patterns without evaluating generated JavaScript on the host. Computed defaults or unsupported assignment shapes produce explicit unavailable-assignment feedback. Rejection retains the captured session prefix and reports the failed operation. Neither outcome becomes a successful whole-program `$return`.

One snapshot object can be resumed once. Applications must atomically claim persisted snapshots across workers/processes; independently restored copies do not share that in-memory guard. After settlement, continue recovery through the returned session. Session counters persist; loop/time budgets come from the resumed `execute` invocation.

Legacy snapshots are rejected. Complete them with the previous package runtime or perform an explicit application migration with verified semantics.

## Streaming and providers

`Chat.onMessageDelta` is a provisional preview; `Chat.handler` is committed delivery. Generation fallback before dispatch sends restart deltas and invalidates abandoned calls. After dispatch, stream failure or restart stops without automatic replay. Completed business actions and `chat.send` deliveries are retained.

Workers and chats with `onMessageDelta` can execute complete calls while streaming continues. Chats without that callback wait for the response to finish and for any accompanying assistant text to be accepted by `Chat.handler` before starting JavaScript. This preserves an announced action's delivery before its business operation when the host does not consume previews.

Cognitive currently supplies complete native calls in its final chunk, so eligible executions can overlap transport draining. An adapter that supplies a complete call earlier can start sooner. Both the stream and the program must settle before the next iteration. Partial source arguments never execute, and `code_generation_started` is no longer emitted. Exact text/component interleaving is not guaranteed by the flattened response contract.

Assistant text can feed host TTS. Native audio output and speculative spoken-output retraction require additional transport work. Audio already played cannot be reset like provisional text.

Models without reliable native tool use are outside the baseline. The runtime rejects multiple native calls in one response; business functions can still run concurrently inside one JavaScript program. Adapter/model behavior, schema support, reasoning continuation, and cross-provider fallback must be validated for each deployment.

## Capability assessment

| Capability                                                      | Implemented behavior or boundary                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| JavaScript chaining, conditions, loops, parallel business calls | Retained through the compiler and VM                                       |
| Selective inspection and large intermediate values              | Bounded previews with exact supported memory                               |
| Named state, object bindings, dynamic tools                     | Retained within capture, schema, and memory limits                         |
| `$return`, `$iterations`, assignment ages                       | Implemented with session persistence and compaction                        |
| Hooks, validation, retries, traces, cancellation                | Retained with native/inner-call correlation                                |
| Thinking and error recovery                                     | Native feedback with retained partial state                                |
| Typed completion/handoff                                        | Terminal exit calls; business results can complete in the same program     |
| Snapshots                                                       | Versioned native continuation; no suspended-stack restoration              |
| Text and rich-message delivery                                  | Native output and ordered validated presentation batches                   |
| Tool-generated progress                                         | Existing host-side delivery behavior remains available                     |
| Audio/image input and citations                                 | Runtime support retained; provider/renderer verification remains necessary |
| Early streaming code arguments and native audio output          | Outside the current Cognitive contract                                     |
| Arbitrary live heap persistence                                 | Not supported                                                              |
| Legacy text-only protocol emulation                             | Removed                                                                    |

## Implementation map

| Area                            | Current files                                                                          | Responsibility                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Static prompt and examples      | `src/prompts/native.ts`, `src/prompts/prompt.ts`, `src/example.ts`                     | Native rules, callable declarations, labeled demonstrations                     |
| Native tool catalogue           | `src/runtime/native-tools.ts`                                                          | Tool schemas, normalization, batch validation, component rendering              |
| Generation and context fitting  | `src/runtime/generate.ts`                                                              | Native responses, provider continuation, provisional streaming, request budgets |
| Session and history             | `src/session.ts`, `src/transcript.ts`, `src/context.ts`                                | Canonical groups, input reconciliation, stable counters, iterations             |
| Explicit memory                 | `src/memory.ts`                                                                        | Exact values, object inventory, provenance, reports, persistence budget         |
| Execution and feedback          | `src/runtime/execute.ts`, `src/runtime/execution-report.ts`                            | Dispatch, settlement, recovery, exits, result previews                          |
| VM bindings and instrumentation | `src/runtime/vm-context.ts`, `src/runtime/tool-wrapper.ts`, `src/vm/`, `src/compiler/` | Business functions, immutable object reads, schema writes, variable capture     |
| Components and chat             | `src/component.ts`, `src/component.default.ts`, `src/chat.ts`                          | Rendering and committed/provisional delivery                                    |
| Snapshots                       | `src/snapshots.ts`, `src/snapshot-assignment.ts`                                       | Versioned continuation and safe assignment restoration                          |
| Provider client                 | `src/custom-client.ts`, `src/runtime/types.ts`, `../cognitive/src/types.ts`            | Shared transport contract and adapter boundary                                  |

Legacy protocol templates, marker parsing, example wire formatting, and return-object exit interpretation were removed. Provider-specific service forwarding remains outside these package files.

## Acceptance criteria and evaluation

Deterministic acceptance cases:

1. A plain chat answer needs no protocol markers, tool call, or VM execution.
2. A read/inspect/answer flow preserves call identity and captured variables.
3. Assistant text plus one program returning `chat.present` or `chat.buttons` finishes in one inference on success, with one matched outer result.
4. `chat.send` continues execution; an unreturned presentation decision neither delivers its batch nor exits. A valid `exit(...)` stops further code without requiring `return`.
5. Schema or exit-hook rejection yields actionable feedback without repeating completed deliveries.
6. Invalid call combinations execute no native calls under the batch policy; every rejected call gets an outcome.
7. Partial calls never execute. Stream failure before dispatch starts no code; failure or restart after dispatch preserves completed effects and memory without automatic replay.
8. Error recovery retains successful inner-call outcomes and does not automatically replay side effects.
9. Snapshot resolution and rejection generate valid continuation history and do not replay the completed prefix.
10. Context reduction preserves call/result groups and required provider continuation data.
11. Independent business calls still run in parallel inside one JavaScript execution.
12. Worker completion remains typed; budget exhaustion cannot masquerade as success.
13. Multimodal input, host events, tool-generated progress, and subsequent user turns retain their origin and ordering.
14. A returned object is accessible as `$return` and through its stable historical entry without implicitly declaring its property names as globals.
15. Successful undefined/null/false/zero/empty results, failure, interruption, and absence of any result remain distinguishable; errors do not relabel an older result as current.
16. Historical data is unaffected by later named-variable mutations, and assignments to built-in bindings or nested history cannot corrupt it.
17. Compaction removes the selected history entries and rebuilds the dense newest-first view without changing stable entry IDs/session numbers, clears a removed latest-result reference, preserves explicitly named variables, and refreshes MEMORY before the next generation.
18. A truncated display preview still refers to a full retained value when advertised as available; compacted or missing values are never advertised as loaded.
19. Multi-turn/session and snapshot restoration preserve history IDs, supported exact values, named state, and the latest-result origin together.
20. MEMORY and the next VM call expose the same bindings, types/availability, and mutability. Built-in names survive identifier validation and never recursively enter variable capture.
21. Named-variable capture, reassignment, shadowing, partial failure, serialization, and memory-limit behavior satisfy the documented contract in both VM drivers without replaying completed effects.
22. First assignment and reassignment, including equal-value writes and asynchronous assignment completion, record truthful turn/iteration/timestamp provenance. Reads, reinjection, compaction, and snapshot restore do not refresh it.
23. Repeated model requests contain exactly one current MEMORY overview in the final supported input message, do not retain old overviews in canonical history, and preserve native tool-result ordering and provider reasoning continuity.
24. Relative ages are recomputed against the request time, distinguish logical turns from internal iterations, and do not imply external-data freshness. Unknown host/legacy provenance is displayed as unknown.
25. Every JavaScript result identifies created and updated variables alongside the return preview, coalesces repeated writes per binding, excludes unchanged/runtime-injected bindings, and reports retained partial changes on failure or interruption.
26. Per-execution change reports and the final MEMORY inventory agree on settled values/provenance; neither report metadata nor display truncation contaminates the actual `$return` value.
27. MEMORY renders short readable entries without duplicate latest-result payloads, omits empty/non-result noise, and explicitly marks unavailable or omitted data. Tests cover empty state, large collections, unusual strings, compaction, and partial capture; evaluation records rendered tokens alongside state-use accuracy.
28. `$iterations[0]` identifies the newest settled iteration, new entries prepend only at settlement, and positions remain fixed during a running invocation. Test empty/out-of-range access, text-only/error entries, the 100-versus-101 boundary, selective compaction, and `$return` identity when its relative position moves.

## Rollout work still required

The runtime design decisions above are implemented. Remaining release validation concerns actual provider behavior and measured capability, not another protocol approval round.

1. Select the supported provider/model matrix and verify the single execution-tool schema, matched history, multimodal input, reasoning signatures, and fallback behavior through each deployed adapter.
2. Choose numeric acceptance thresholds for task success, correction iterations, duplicate deliveries, repeated effects, tokens, inference count, time to first visible output, and total latency. Include long histories and small supported models.
3. Run the opt-in comparative chat, worker, snapshot, voice, multilingual, memory, and recovery evaluations. The 90% capability target does not replace concrete release thresholds. No benchmark success rate is claimed here.
4. Validate application migration using the [migration guide](native-protocol-migration.md), including session ownership, component schemas, terminal exit calls, hooks/events, snapshots, budgets, and model configuration. Keep the prior version available for unfinished legacy executions.

Early tool-argument deltas, exact arbitrary text/component interleaving, native audio output, and lazy history storage are separate future capabilities. They are not unresolved behavior in the shipped baseline.

## Provider references

Checked during the design discussion on 2026-09-18:

- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling): multiple calls, call results, reasoning items, and provider-specific free-form custom tools.
- [Anthropic parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use): multiple calls can be executed sequentially or concurrently by the application.
- [Anthropic tool-call handling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls): call/result adjacency and grouping.
- [Anthropic thinking](https://platform.claude.com/docs/en/about-claude/models/extended-thinking-models): preserve required thinking blocks during tool continuation.
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) and [thought signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures): multi-call support and provider continuation requirements.
