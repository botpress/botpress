# Migrating to the native-message runtime

This is a major-version change. Model output, retained history, and snapshots use the native-message protocol. The runtime does not interpret the old marker grammar as executable instructions.

## Model-facing interface

`run_javascript({ code: string })` is now the sole provider-native tool. Requests disable parallel native calls, and a batch containing more than one call is rejected before dispatch. If a streaming adapter exposes another call after the first has already begun, execution fails without replaying completed effects. Ordinary assistant messages and their provisional text streaming remain unchanged.

| Previous behavior                                 | Current behavior                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| Text inside a message block                       | Ordinary assistant text                                                  |
| Rich component block or native `show_*` call      | Return `chat.present({ messages })` inside JavaScript                    |
| Separate button calls plus `listen`               | Return `chat.buttons(buttons)` inside JavaScript                         |
| JavaScript block                                  | `run_javascript({ code: "..." })`                                        |
| Separate native exit call                         | Return `exit(name, payload)` from JavaScript                             |
| Silent native `listen({})`                        | Return `exit()` from JavaScript                                          |
| Inspect a business result                         | Return `inspect(value)` or an ordinary value                             |
| Return-object properties merged into globals      | Actual result at `$return`; explicit declarations remain named variables |
| Execution feedback disguised as user instructions | Matched native tool results                                              |
| Conversation serialized into system instructions  | Native user/assistant messages, retaining attachments                    |

Business tools and object methods remain callable inside JavaScript. Presentation and exit schemas move into the documented VM API; their runtime validators remain authoritative. Object properties, including schemas, access rules, and current values, belong in Memory. Reserved runtime helper names cannot be replaced by business tools or retained bindings.

Object state still reconciles host input with VM writes: an unchanged host value retains a successful VM override; a changed host value replaces it. Property reads are immutable snapshots. Update a writable property by assigning its complete replacement, such as `account.profile = { ...account.profile, age: 42 }`. Every replacement is schema-validated. Restored host properties become available after their corresponding objects are configured again.

## Components, decisions, and exits

Inside a `run_javascript` program, return a presentation decision:

```js
return chat.present({
  messages: [
    {
      component: 'Card',
      props: { title: 'Standard', subtitle: '$20/month' },
      body: 'Five projects.',
    },
    {
      component: 'Image',
      props: { url: 'https://example.com/photo.jpg', alt: 'Forest trail' },
    },
  ],
})
```

The returned batch defaults to `ListenExit`. All items are validated before any terminal delivery, and required memory settlement precedes terminal effects. Delivery remains ordered. A later delivery failure does not undo acknowledged earlier deliveries; the exit is withheld and the next response receives correction feedback. Arbitrary host transports cannot guarantee exactly-once delivery merely because the runtime tracks receipts.

For progress that must occur during execution, use `await chat.send({ component: 'Text', body: 'Checking the account.' })`, or pass an array of messages. It is nonterminal. Ordinary assistant text is preferable for an update already known before execution; text accompanying the native call is a pre-action update and cannot depend on an unseen result.

A business result can now complete a worker in the same program:

```js
const account = await readAccount()

return exit('booked', { ticketId: account.ticketId })
```

The payload is the actual schema value: `exit('total', 42)` uses a number directly, without a `{ value }` wrapper. `exit()` waits silently in a chat. The configured exit and `onExit` still validate completion. Worker prose alone does not complete a task. In chat, successful nonempty text without calls finishes naturally; empty output alone is not a silent exit.

Continue to teach and write `return exit(...)`. The `exit(...)` call itself now stops JavaScript immediately after successful validation, so an omitted `return` is tolerated. A successful exit cannot be swallowed by user catch/finally blocks; invalid names or payloads remain catchable validation errors. `inspect`, `chat.present`, and `chat.buttons` still construct opaque returned decisions. Plain objects cannot impersonate them. Required named-memory settlement happens before terminal presentation or exit, and internal terminal receipts do not replace `$return`.

Exit control flow applies to compiled VM programs, including their declared functions and callbacks. Dynamically generated source (`eval`, `Function`, and related constructors) is unsupported; compiler checks reject recognizable forms. These checks are not a security boundary for reflective code, and the Node fallback remains unsandboxed.

For a presentation with a custom exit, return `chat.present({ messages, exit: { name: "done", payload } })`. Its `exit` field is a plain descriptor, not a call to `exit(...)`; calling the function there would stop before the presentation is constructed. Await all business work before requesting completion. Started but unawaited work is joined and reported as an execution error, rather than silently completing.

Trailing calls are no longer implicit program returns. `chat.buttons(buttons)` discards its decision; write `return chat.buttons(buttons)` to present it. A final business call is still awaited, but its value is exposed for inspection only when explicitly returned.

When the next model response needs to inspect data, use:

```js
const account = await readAccount()

return inspect(account)
```

A plain `return account` retains the same nonterminal behavior. Successful `undefined` still receives a result and another response. An `inspect` decision stores its underlying value in `$return`, without storing the decision object.

Structured `Example` definitions remain supported. Existing text-plus-listen examples become natural assistant replies; rich messages and typed exits are rendered into one JavaScript program. Migrate handwritten native `show_*`, `listen`, and `exit_*` examples to these helpers.

## Own state with a Session

```typescript
import { Chat, Session, execute } from 'llmz'

const session = new Session({ maxBytes: 16 * 1024 * 1024 })
const chat = new Chat({ handler: (component) => render(component) })

await execute({
  client,
  chat,
  session,
  messages: [{ role: 'user', content: 'Look up my account.' }],
  tools,
})

await execute({
  client,
  chat,
  session,
  messages: [{ role: 'user', content: 'Use that account for my next question.' }],
  tools,
})

const stored = session.toJSON()
const restored = Session.fromJSON(stored)
```

Supply only new input in `messages`. A host-maintained `Chat.transcript` can still supply its conversation projection; exact delivered assistant text is reconciled with retained native history. Prefer one clear input owner and avoid supplying the same user input through both interfaces. A transcript alone cannot restore values omitted from result previews. Reuse/persist `Session` for cross-turn memory.

Concurrent executions of one session are rejected. Native tool results must remain paired with their original calls; do not insert new input while a snapshot call is pending. Resolve or reject it before accepting the next turn.

## JavaScript memory

```js
const account = await readAccount()
return { account, count: 3 }
```

The next execution can read `account`, `$return.account`, and `$iterations[0].result.count`. Returning an object does not create global bindings for its properties. `$iterations` includes all settled model iterations, including text, errors, presentations, and exits; inspect `hasResult` before using an entry’s result. Indexes stay fixed during a JavaScript invocation, then shift when another iteration settles.

Named variables survive compaction. Automatic results do not: compacting the origin of `$return` clears it. Use `const saved = $return.account` to deliberately retain useful data. `session.compact(retainedIterationIds)` removes whole settled call/result groups and their automatic memory together. Pending groups cannot be compacted.

Automatic context fitting removes older settled iterations and their old turn inputs. It does not silently shorten the current user input or a newly imported transcript. If those inputs alone exceed the context budget, shorten the imported history or increase the configured context limit. A hook that replaces canonical history must supply an input that fits; LLMz will not discard its custom messages during automatic compaction.

Both history and `$return` are read-only snapshots. Named variables are separately captured values; changing one must not rewrite a historical result. Successful `undefined` returns are distinct from missing results, and failed/interrupted code does not replace the previous successful `$return`.

Memory retains plain objects, dense arrays, strings, finite numbers (including negative zero), booleans, null, and undefined at any supported nesting depth. It does not retain functions, closures, symbols, big integers, cycles, class instances, accessors, dates, maps, or sets. Project such values into supported data explicitly. Capture and size failures are reported as unavailable state, not silently replaced with previews; do not repeat completed effects to repair a capture failure.

The default exact-state limit is 16 MiB. This is separate from the model context budget. The initial implementation materializes bounded history for the VM; it is not a lazy external object store or persistent arbitrary JavaScript heap.

Assignment metadata records successful writes, including equal-value assignments. Reads, restoration, and prompt rendering do not refresh it. Observed nested mutations are labeled updates rather than fresh assignments. Ages describe memory writes, not external-data freshness.

Each request gets one fresh `## Memory` overview in its final model-input message. Canonical history never accumulates stale overviews. Each JavaScript result also reports created/updated variables alongside its return preview; this report is not part of `$return`.

## Snapshots

Native snapshots retain the unresolved execution call, session history, exact supported values, and assignment provenance in a versioned native payload. Persist `snapshot.toJSON()` and restore with `Snapshot.fromJSON()`.

Snapshot resolution supplies the interrupted inner tool’s result. It does not resume a JavaScript instruction pointer or imply the remaining program ran. The model receives the settlement and generates continuation code using preserved variables. Repeated snapshot settlement is rejected.

The runtime permits one resumption per snapshot object. Once the pending native result has been accepted, continue any recovery using the returned execution's `session`; do not resubmit the original snapshot. A clone or a separately restored snapshot has independent in-memory state, so hosts must atomically claim persisted snapshots before resuming them across workers or processes.

Resolution restores identifiers, nested destructuring, renamed properties, rest bindings, and literal-data defaults without evaluating generated JavaScript on the host. A default that requires computation or another function produces explicit assignment-unavailable feedback; the model must finish that assignment in a subsequent JavaScript call.

Host-thrown `ThinkSignal` and `SnapshotSignal` are runtime control operations. Generated JavaScript cannot catch them and continue or perform cleanup in a surrounding `finally`; complete required program work before calling an operation that interrupts. Already-started host operations are joined before the next response or snapshot is returned. Ordinary business errors remain catchable, and host-side tool cleanup still runs normally.

Snapshots or pending sessions from older protocol versions must not be relabeled as single-tool history. Legacy snapshots lack native call/history ownership and cannot silently resume on the new runtime. Complete those runs with the previous package version, or perform an explicit application migration whose semantics you can verify.

## Streaming, hooks, and providers

`Chat.onMessageDelta` remains a provisional preview. Workers and chats with this callback can start a complete validated structured call while streaming continues, but partial arguments never execute. Chats without the callback wait for the response to finish and for any accompanying assistant text to be accepted by `Chat.handler` before starting JavaScript. An announced action therefore reaches the committed handler before its business operation when previews are unavailable.

The next iteration waits for both streaming and JavaScript to settle. Before dispatch, restart deltas retract previews from the abandoned generation. After dispatch, stream failure or restart stops without automatic replay, preserving acknowledged effects and retained memory.

Existing execution/tool hooks still wrap JavaScript and inner business functions. Presentation decisions and requested exits settle memory before terminal delivery or completion; `chat.send` delivers nonterminal progress during execution. Cognitive currently emits calls in its final chunk, so eligible executions can overlap transport draining; adapters may expose complete calls earlier. `code_generation_started` is removed. Use `llm_call_started` for generation progress and `llm_call_success` for completed source. Native arguments are not executed as partial source code.

Code replaced by `onBeforeExecution` is disclosed in tool feedback, including actual business-call outcomes and whether completion occurred. The original assistant call remains in native history. Hooks that replace a terminal program with a plain return intentionally require another response to choose an exit; an exit removed by the hook is not applied automatically.

Custom clients must forward native `tools` and `toolControl`, return native calls with unique IDs and object arguments, and report successful completion metadata. Do not return marker-formatted code as assistant text. Do not strip call IDs or replay cached legacy wire responses.

Opaque provider reasoning/signature fields can be supplied as `assistantMessage` and/or `continuation`; LLMz preserves them without interpreting them. The provider adapter must actually accept and resend the required native continuation representation. Plain reasoning text is insufficient for provider signatures. This change does not certify every Cognitive/provider/model path; run the opt-in live matrix for each supported deployment.

Native messages and continuation fields must use JSON data. Encode binary signatures as strings rather than custom objects or byte buffers. LLMz rejects values such as maps, class instances, cycles, and non-finite numbers before storing an assistant response, preventing silent loss during JSON persistence.

Audio/image input remains attached to its original turn. Assistant text can feed a host TTS renderer; native streamed audio output and speculative speech retraction are not provided by this text-generation contract. Models need reliable single-tool calling; native multi-call support is no longer required.

## Validation and rollout

Run the deterministic suite and typecheck before adoption. Then run configured-provider evaluations for chat, workers, rich batches, memory reuse, interruption, streaming fallback, and multimodal input. Compare task success, calls, tokens, latency, duplicate messages, and repeated effects. Unit tests establish runtime contracts, not the 90% model capability target.
