# LLMz API guide

LLMz combines native conversation with JavaScript orchestration. Models speak through ordinary assistant messages and use one native tool, `run_javascript`, for business operations, rich presentation, inspection, and typed completion.

For breaking changes, see the [migration guide](docs/native-protocol-migration.md). The [protocol specification](docs/native-protocol-spec.md) records execution and memory semantics.

## Execution

```typescript
import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit, Tool } from 'llmz'

const client = new Client({ botId: '...', token: '...' })
const readAccount = new Tool({
  name: 'readAccount',
  description: 'Read an account by ID.',
  input: z.object({ id: z.string() }),
  output: z.object({ id: z.string(), plan: z.string() }),
  handler: async ({ id }) => ({ id, plan: 'Pro' }),
})
const done = new Exit({
  name: 'done',
  description: 'Return the verified account plan.',
  schema: z.object({ plan: z.string() }),
})

const result = await execute({
  client,
  instructions: 'Find the plan for account acct_7 and report it.',
  tools: [readAccount],
  exits: [done],
})

if (result.is(done)) {
  console.log(result.output.plan)
}
```

The model calls `run_javascript` with a program that uses the actual result directly:

```js
const account = await readAccount({ id: 'acct_7' })

return exit('done', { plan: account.plan })
```

The call validates its payload and stops JavaScript; after required memory settlement and the exit hook, LLMz completes without another inference. Use `return inspect(account)` when the next model response needs to interpret the result.

Generated programs are JavaScript, including top-level `await` and `return`. TypeScript declarations describe the callable API; JSX, type annotations, and package imports are not executable response syntax. Calls within JavaScript can depend on each other without additional inference. Independent operations can use `Promise.all`.

With no `chat`, execution is a worker and requires a typed exit. With `chat`, an ordinary successful answer without tool calls finishes with `ListenExit`. Exhausted budgets are incomplete/error outcomes; they never manufacture successful exit data.

## Chat and native messages

```typescript
import { Chat, DefaultComponents, Session, execute } from 'llmz'

const session = new Session()
const chat = new Chat({
  components: [DefaultComponents.Button, DefaultComponents.Card],
  handler: async (component, metadata) => {
    await deliver(component, metadata)
  },
  onMessageDelta: (delta) => {
    if (delta.restart) {
      return clearPreview(delta.iterationId)
    }

    return updatePreview(delta.iterationId, delta.id, delta.content)
  },
})

await execute({
  client,
  chat,
  session,
  messages: [{ role: 'user', content: 'Help me pick a plan.' }],
  tools,
})
```

`deliver`, `clearPreview`, and `updatePreview` above are application callbacks. `Chat.handler` receives rendered components; ordinary assistant prose uses the configured text component or the default text renderer. Registering a text component is optional. A chat configured with the speech component can deliver ordinary assistant text through its speech renderer.

`messages` contains only new input. A `Chat.transcript` getter can alternatively supply the host-maintained conversation projection. Keep input ownership clear so the same user message is not supplied twice. LLMz reconciles exact delivered assistant text with canonical native history.

Transcript user messages may contain image or audio attachments. Native history preserves those attachments on the turn that supplied them. Events and summaries become explicitly labeled input records, not system instructions. Audio-capable models may receive audio directly; other paths use the configured Cognitive transcription model.

## Presentation and exits

`run_javascript` is the only native tool, with `{ code: string }` arguments and at most one call per response. Inside JavaScript, business functions and these runtime helpers are available:

| Helper                              | Behavior                                            |
| ----------------------------------- | --------------------------------------------------- |
| `return inspect(value)`             | Preserve and inspect the value in the next response |
| `return value`                      | Preserve the existing nonterminal return behavior   |
| `return exit()`                     | Wait silently with `ListenExit`                     |
| `return exit('booked', payload)`    | Complete using a configured typed exit              |
| `return chat.present({ messages })` | Deliver an ordered rich-message batch and listen    |
| `return chat.buttons(buttons)`      | Present button props and listen                     |
| `await chat.send(messageOrArray)`   | Deliver nonterminal progress in program order       |

Presentation messages have `{ component, props?, body? }`. Component schemas, aliases, and renderers remain authoritative; body is separate from props. The native provider only validates the execution tool's code argument. Actual component and exit arguments are validated by LLMz.

Prefer `return exit(...)` in programs and examples. A valid `exit(...)` also stops JavaScript if `return` is omitted. Surrounding `catch` and `finally` blocks cannot continue after a successful exit. Invalid exit names or payloads remain ordinary validation errors. `inspect`, `chat.present`, and `chat.buttons` still construct opaque decisions that must be returned; discarded presentation decisions do nothing, and plain objects cannot forge them. Required named-memory settlement happens before terminal presentation or completion. A returned batch is fully validated before delivery; required deliveries run in order before its final exit. Completed deliveries remain recorded if a later step fails.

Exit control flow applies to compiled VM programs, including their declared functions and callbacks. Dynamically generated source (`eval`, `Function`, and related constructors) is unsupported; compiler checks reject recognizable forms. These checks are not a security boundary for reflective code, and the Node fallback remains unsandboxed.

For a presentation with a custom exit, return `chat.present({ messages, exit: { name: "done", payload } })`. Its `exit` field is a plain descriptor, not a call to `exit(...)`; calling the function there would stop before the presentation is constructed. Await all business work before requesting completion. Started but unawaited work is joined and reported as an execution error, rather than silently completing.

```js
const ticket = await bookTicket({ flightId: 'flight_7' })

return exit('booked', { ticketId: ticket.id })
```

Exit payload validation happens when `exit` is called. The runtime settles memory and runs `onExit` before completing. Throwing from `onExit` returns correction feedback. Payloads are passed directly, including nonobject values: `exit('total', 42)`. They must be JSON-compatible. Omit `schema` for an exit without data; use `z.null()` for an explicit null payload. `z.undefined()` and `z.void()` are rejected.

Assistant text may accompany a native call and keeps its existing streaming behavior, but it is generated before code executes. Use `chat.send` for a message whose contents or ordering depend on operations within the program. Use `Promise.all` for independent business calls; native parallel calls are disabled.

## Tools and objects

`Tool` continues to provide schemas, handlers, retry policies, and tracing. Its signature is documented in the JavaScript API section rather than duplicated into a native function tool. Use `tool.getTypings()` to inspect that declaration.

`ObjectInstance` provides named objects containing tools and properties. Namespaced methods appear in the callable JavaScript API section. Property values, schemas, and readonly/writable rules belong in the memory manager and Memory overview. Dynamic `instructions`, `tools`, and `objects` getters can respond to the current `Context`; the model sees their current resolved state.

Property reads are deeply immutable snapshots. To update a writable object property, assign its complete replacement, for example `account.profile = { ...account.profile, age: 42 }`. Nested edits are rejected. Replacement assignments run the property schema validator and update its memory provenance.

For property refreshes, an unchanged host value preserves a successful VM override. A changed host value replaces the override as the authoritative state. Recreating an unchanged host object does not make its values newly assigned. Persisted host properties become available after their host objects are configured again on restoration.

The configured VM driver controls isolation and resource limits. QuickJS is the default portable JavaScript driver; the Node.js driver is an alternative. Available host tools determine which real operations generated code can perform. The native-message protocol does not change a driver's isolation guarantees.

## Sessions and memory

Reuse one `Session` per conversation or workflow to retain exact supported values and native history across calls to `execute()`:

```typescript
const session = new Session({
  variables: { preferredCurrency: 'CAD' },
  maxBytes: 16 * 1024 * 1024,
})

const saved = session.toJSON()
const restored = Session.fromJSON(saved)
```

The default exact-state budget is 16 MiB, separate from the prompt context budget. Persistence includes values, call/result history, stable turn and iteration counters, and assignment provenance. A tool-result preview alone cannot reconstruct a session.

Inside JavaScript:

```javascript
const account = await readAccount({ id: 'acct_7' })
return { account, count: 3 }
```

Subsequent code can access:

```javascript
account // Explicitly captured named variable
$return.account // Latest successful JavaScript result
$iterations[0].result // Result of the latest settled model iteration, if any
$iterations[1].hasResult // Whether the preceding iteration captured a result
```

Returning an object never spreads its fields into globals. `const saved = $return.account` deliberately keeps data independently of automatic history.

`$iterations` is newest first and includes settled text, presentation, exit, failed, and interrupted iterations as well as successful JavaScript. Entries without JavaScript results occupy indexes. The running iteration is not yet included; positions are fixed during one execution. A successful `undefined` result has `hasResult: true`, while a text-only iteration has `hasResult: false`.

`$return` changes after successful JavaScript, including successful `undefined`; errors and interruptions retain the previous result. Results/history are read-only snapshots. Named variables are separately captured state, not a persistent arbitrary JavaScript heap.

`session.compact(retainedIterationIds)` retains complete settled native groups and prunes automatic history in the same operation. Named variables survive. Compacting the origin of `$return` clears it. Pending groups cannot be compacted. Context fitting may compact older settled groups automatically.

The supported value domain is plain objects, dense arrays, strings, finite numbers, booleans, null, and undefined. Unsupported values and memory-limit failures produce unavailable-state reports. Convert dates, maps, sets, big integers, class instances, functions, and cyclic data into supported values before retaining them. Never replay completed side effects just because later memory capture failed.

## Model-visible memory reports

The final input to each model request receives one current overview:

```markdown
## Memory

Available in JavaScript. Previews are abbreviated; historical results are read-only.

### Variables

- `account`: { id: "acct_7", plan: "Pro" } — set just now (this turn).
- `currency`: "CAD" — set 1 minute ago (2 turns ago).

### Results

- `$return` (also `$iterations[0].result`): { account: { … }, count: 3 } — returned just now (this turn).
```

The footer is request-local; old relative ages do not accumulate in canonical history. It is appended to the final tool result during tool continuations, preserving call/result order.

Each JavaScript result reports its return preview plus created/updated named variables. That metadata does not change `$return`. Successful assignments update provenance, even if the value is unchanged. Reads and restoration do not reset assignment age. Observed nested mutations are updates, not binding reassignments. Assignment age does not establish external-data freshness.

## Snapshots and thinking interruptions

A tool can throw `ThinkSignal` to stop execution and ask the model to inspect its reason/context. It can throw `SnapshotSignal` to suspend a workflow pending an external result. Neither signal implies the statements after it ran.

```typescript
import { Snapshot, SnapshotSignal } from 'llmz'

// Inside a business tool handler:
throw new SnapshotSignal('Awaiting approval')

// After execute() returns an interrupted result:
const savedSnapshot = result.snapshot.toJSON()

// When the external operation settles:
const snapshot = Snapshot.fromJSON(savedSnapshot)
snapshot.resolve({ approved: true })
const continued = await execute({ client, snapshot, tools })
```

Use the existing result type guard before accessing `snapshot`. Native snapshots store the unresolved native call and session state. Resolution supplies the interrupted inner operation outcome and a later model response generates continuation code. This does not restore a suspended JavaScript instruction pointer. A resolved operation is not the successful return from the entire original program.

New user input and concurrent execution are rejected while a native call is pending. Resolve/reject it first. Legacy snapshots require the previous package runtime or a deliberate external conversion; they cannot silently acquire native history.

## Hooks and results

| Hook                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `onIterationStart`  | Inspect or adjust the next iteration's configuration |
| `onIterationEnd`    | Observe a settled iteration                          |
| `onBeforeExecution` | Inspect/replace generated JavaScript before it runs  |
| `onBeforeTool`      | Validate/adjust an inner business tool input         |
| `onAfterTool`       | Observe/adjust an inner business tool output         |
| `onExit`            | Validate or reject a typed completion                |
| `onTrace`           | Observe events without blocking the execution loop   |

Native presentation dispatch is distinct from business-tool hooks. A hook that fails before a native call exists is reported as runtime context, not with an invented tool-result ID.

`result.is(exit)` narrows typed exit output. `result.isSuccess()`, `result.isError()`, and `result.isInterrupted()` distinguish completion, failure, and snapshots. `result.iterations` contains execution records; `result.tokens` aggregates usage. Returned session state can be reused or serialized separately from the visible conversation.

## Streaming and provider adapters

Assistant text deltas remain provisional until successful generation. A complete structured native call can start JavaScript while the stream is open; partial arguments never execute. The next iteration waits for both streaming and JavaScript. Before dispatch, fallback can retract previews and replace a generation. After dispatch, a stream failure or restart stops the iteration without automatically replaying the program; completed effects and retained memory survive.

```typescript
await execute({
  client,
  chat,
  session,
  options: {
    loop: 10,
    timeout: 60_000,
    maxTokens: 32_000,
    midStreamFallback: true,
    maxTimeToFirstToken: 5_000,
    transcriptionModel: 'fast',
  },
})
```

A reset-capable preview consumer is required for streaming fallback. Assistant text handlers wait for successful generation; `chat.send` can deliver progress while JavaScript runs. Cognitive currently emits complete calls in its final chunk, allowing execution to overlap transport draining. Adapters that supply complete calls earlier can start execution sooner. Partial source streaming is not required, and the retired `code_generation_started` trace is no longer emitted.

Custom model clients must forward tools/tool control and return normalized native calls with unique IDs. Where required, preserve provider reasoning/signature state through the complete `assistantMessage` and/or opaque `continuation` fields. The adapter must support consuming that representation on its next request. Flattened reasoning text is not enough for provider signatures.

The baseline requires reliable single-tool calling; the runtime rejects multiple execution calls in one response. Native audio output, arbitrary text/tool interleaving, and early streaming argument deltas require additional provider transport capabilities. Host TTS of assistant text is compatible with this interface.

## Testing and examples

Run `pnpm test`, `pnpm check:type`, and `pnpm build` for local validation. Live model evaluations are opt-in through the configured Cognitive credentials and `LLMZ_EVAL_MODELS`; see the README. Deterministic tests verify runtime behavior, not provider success rates or the 90% capability target.

The [examples directory](examples) includes chat, workers, rich components, object bindings, hooks, chaining, snapshots, and streaming. Earlier recordings illustrate UI behavior and may display the retired wire syntax; the source and migration guide define the native interface.
