# LLMZ API guide

[Quickstart](./README.md) · [Sessions](#sessions-and-messages) · [Memory](#execution-and-memory) · [Tools](#tools-and-exits) · [Components](#components) · [Streaming](#streaming-and-delivery) · [Budgets](#token-budgets-and-compaction) · [Inspection](#inspection) · [Hooks](#hooks) · [Migration](#migrating-from-the-previous-api)

## The public API

| API                           | Responsibility                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `execute(props)`              | Run model iterations until completion or failure.                                 |
| `Session`                     | Own input queues, native conversation history, and exact retained memory.         |
| `Chat`                        | Configure assistant text and rich component delivery.                             |
| `Tool`                        | Expose a host function with optional input and output schemas.                    |
| `Exit`                        | Define a named completion and its output schema.                                  |
| `Component`                   | Define a rich message schema, exact JavaScript method name, and delivery handler. |
| `ExecutionResult`             | Read one run's outcome, provider usage, and diagnostics.                          |
| `truncate`                    | Attach a display budget to a value without changing its data.                     |
| `inspect` / `createInspector` | Format bounded previews for host integrations.                                    |

## Sessions and messages

Create one `Session` per conversation or worker context. Append input before calling `execute({ session, ... })`. Omit `session` to create a fresh one, then read it from `result.session`.

```ts
import { Session } from 'llmz'

const session = new Session()
session.append([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'How can I help?' },
  {
    role: 'user',
    content: 'What does this receipt say?',
    attachments: [{ type: 'image', url: 'https://example.com/receipt.png', id: 'receipt', alt: 'Store receipt' }],
  },
])
```

`append` accepts a native Cognitive message, a `Transcript.Message`, or an array of either. It validates the whole batch before enqueueing any of it. Identical messages remain distinct inputs. The session copies its inputs and returns copies of its messages.

| Input                                   | Cognitive representation                                                   |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Native text or multipart message        | Preserves content, part order, and opaque JSON provider fields.            |
| User/assistant text                     | Retains its role and text.                                                 |
| `attachments`                           | Adds image/audio parts to that message, with adjacent ID/alt descriptions. |
| `modality: 'voice'` or audio attachment | Labels convenience input as a voice transcript.                            |
| `role: 'event'`                         | User-role data labeled with the event name and a bounded payload preview.  |
| `role: 'summary'`                       | User-role data labeled as a conversation summary.                          |

Native multipart inputs already describe their content; do not combine them with convenience `attachments` or `modality`. Events and summaries do not become system instructions. Pass system instructions through `execute({ instructions })`.

`session.transcript` returns the retained conversation and queued input, preserving `event` and `summary` roles. `session.messages` exposes processed native messages; `session.pendingMessages` exposes queued native input. All three return detached copies.

External events start turns just like user messages. Append them, then execute:

```ts
import { Client } from '@botpress/client'
import { Chat, Session, execute } from 'llmz'

const client = new Client()
const session = new Session()
const chat = new Chat({ response: { handler: (text) => console.log(text) } })

session.append({
  role: 'event',
  name: 'button.clicked',
  payload: { button: 'confirm', orderId: 'order-42' },
})
await execute({ client, session, chat, instructions: 'Respond to order actions.' })
```

Appending an event does not start execution automatically. Events arriving during a run stay queued for the next call; repeated clicks remain separate events. Event payloads are data, so validate authorization and business rules in your tool handlers.

Input cannot inject native tool calls or results. Restore a serialized session to continue existing tool history. The runtime retains assistant calls and their matching results together, including provider continuation metadata. It never appends memory instructions to signed assistant output.

Convenience event payloads receive a 5,000-token preview in native model input. The original payload remains in `session.transcript` and serialized session state until that event is compacted. Ordinary user text is retained in full. Keep authoritative application events in the host when they must outlive conversation compaction.

Session status is `idle`, `pending`, or `active`. A turn claims queued input once. Input arriving during execution remains queued until that turn completes. Concurrent `execute` calls on one session are rejected.

`session.messages` is canonical history. `session.pendingMessages` contains unclaimed input. `session.requestMessages()` produces a copy with an ephemeral memory overview; `requestMessages({ memory: false })` omits the overview. Runtime lifecycle methods such as `beginTurn`, `nextIteration`, and `settleIteration` are used by `execute`; applications normally only need `append` and persistence.

## Execution and memory

The model receives one native tool, `run_javascript`, and declarations for the registered host tools, objects, components, and exits. A response may contain at most one JavaScript call. Its program can compose multiple business operations.

These examples are JavaScript generated by the model, not host TypeScript:

```js
const account = await getAccount({ id: 'customer-42' })
return inspect(account)
```

```js
return exit('done', { accountId: account.id })
```

`inspect(value)` exposes a preview in the next model request. Exact retained values remain available to JavaScript. `exit(name, payload)` validates a completion payload against its registered exit. Normal returned data does not complete a worker.

Worker prompts require every response to be a `run_javascript` call with empty assistant text, including during recovery and completion. Workers must not emit preambles, progress updates, or acknowledgements such as “Done.” Results are inspected or returned through a registered exit.

| Value             | Lifetime                                                                     |
| ----------------- | ---------------------------------------------------------------------------- |
| Named variables   | Remain in session memory across executions and history compaction.           |
| `$return`         | Latest available returned result; read-only.                                 |
| `$iterations`     | Retained iteration records, newest first; records and results are read-only. |
| Object properties | Host-backed values with declared read/write access.                          |
| Prompt previews   | Derived display text; never the source of stored values.                     |

A record's `hasResult` distinguishes an absent result from a result whose exact value is `undefined`. A failed iteration without a new result preserves the previous `$return`. A new result that cannot be retained clears `$return` rather than exposing stale evidence. Compaction removes discarded iteration results; it does not fall back to an older `$return`.

Memory accepts finite numbers, booleans, strings, null, undefined, dense arrays, and plain data objects. Its codec preserves `undefined` and negative zero through JSON persistence. Functions, accessors, symbols, cycles, and custom class instances cannot be stored as exact memory values.

```ts
import { Session } from 'llmz'

const session = new Session({
  variables: { accountId: 'customer-42', attempts: 0 },
  maxBytes: 4 * 1024 * 1024,
})
console.log(session.memory.variables)
console.log(session.iterations)
```

The default memory limit is 16 MiB. It covers encoded named variables, object memory, and retained result records; it is not a byte limit on all conversation messages. Token budgeting controls the request sent to the model. Successful writes may be retained when later writes exceed capacity; reports describe unavailable values. Host side effects are not rolled back.

## Persistence and recovery

Persist `session.toJSON()` after execution has settled. It rejects serialization while a run holds the session lock or an iteration is pending.

```ts
import { Session } from 'llmz'

const session = new Session()
session.append({ role: 'user', content: 'Queued request' })
const encoded = JSON.stringify(session.toJSON())
const restored = Session.fromJSON(JSON.parse(encoded))
console.log(restored.status) // pending
```

Restoration checks format versions, chronology, identities, call/result pairing, exact result encodings, and memory capacity. Unknown versions are rejected. Conversation/provider fields must be acyclic JSON data; encode binary values explicitly. This is conversation and memory persistence, not a paused JavaScript stack.

After a failed execution, the session retains the active input batch and any completed effects/results. Executing it again continues that turn. Newly appended messages remain queued. Applications should inspect failures before retrying operations that produce external effects.

`result.toJSON()` is a compact outcome summary. `result.diagnostics()` exports run diagnostics. Neither replaces `session.toJSON()`.

## Tools and exits

A `Tool` has a name, async handler, optional description, input/output schemas, aliases, metadata, and retry callback. Zui parses the supplied schemas at the tool boundary. Dynamic tools, objects, exits, instructions, and model configuration can be supplied as getters evaluated for each iteration.

```ts
import { z } from '@bpinternal/zui'
import { Tool, Exit } from 'llmz'

const getStock = new Tool({
  name: 'getStock',
  input: z.object({ sku: z.string() }),
  output: z.number(),
  handler: async ({ sku }) => (sku === 'coffee' ? 20 : 0),
})
const done = new Exit({
  name: 'done',
  description: 'Return available stock.',
  schema: z.object({ available: z.number() }),
})
```

Use `result.is(done)` to narrow the result and its output type. `result.isError()` exposes an execution failure. Without custom exits, workers receive `DefaultExit`. An explicit empty `exits` array supplies no completion exits. Chat adds `ListenExit`; an accepted plain assistant answer can complete the chat turn.

Tools return business data. Generated code sends rich messages through registered `chat.<component>(props)` methods. A `ThinkSignal` requests another reasoning iteration; it is not durable pause/resume.

## Components

Component names are exact JavaScript identifiers. Object and array schemas are supported; aliases and generation metadata are not component options. Text names such as `text` and `message` are reserved for native assistant output.

```ts
import { z } from '@bpinternal/zui'
import { Chat, Component } from 'llmz'

const cards = new Component({
  name: 'cards',
  description: 'Show a list of products.',
  props: z.array(z.object({ title: z.string(), price: z.number() })),
  handler: (items, metadata) => {
    console.log(metadata.id, items)
  },
})
const chat = new Chat({ components: [cards] })
const rendered = cards.render([{ title: 'Coffee', price: 12 }])
console.log(rendered.props)
```

The model calls `chat.cards(...)`. `render` parses props once and captures an immutable delivery value. `withHandler` binds delivery without changing a reusable definition. `DefaultComponents` provides ready-made rich message definitions; bind handlers before using them for delivery.

`Chat.response` accepts `markdown`, `text`, or `speech`, or `{ preset, instructions, handler, onDelta }`. Speech is a prose style for text-to-speech; it does not synthesize audio.

## Streaming and delivery

`response.onDelta` receives previews. Its normal event has `delta`, accumulated `content`, `id`, and `iterationId`. A restart event has `restart: true`, an iteration ID, attempt number, models, and reason. Retract the prior preview before displaying replacement text.

`response.handler` receives the accepted complete text and its message metadata. Components use their own handlers. Without handlers, native text is still retained in session history.

Complete JavaScript calls can execute while streaming continues. If a stream fails after dispatch, the runtime retains completed effects and reports the interruption; it does not replay the program on another model. `options.midStreamFallback` enables restarts before dispatch and requires a preview consumer capable of handling retractions. Normal preview callback failures are ignored; failed retractions stop generation. A final delivery failure can fail execution.

## Token budgets and compaction

`options.maxTokens` caps the context window, not output alone. It must be a positive safe integer. The effective limit is the smaller of this cap and every configured model's input limit. A fallback list uses the smallest input and output limits so the same request fits every candidate.

The runtime reserves output space before fitting input: 10% of the effective limit, with a 256-token floor and 16,000-token ceiling, also bounded by the model's output limit and space for input. A window too small for the request fails before model dispatch.

Input measurement includes system instructions, message scaffolding, tools, JavaScript arguments, tool receipts, memory previews, and execution-budget guidance. Enforcement uses exact tokenization with the configured local tokenizer. This remains an estimate of the provider's request accounting: model tokenizers and provider framing can differ. Image/audio transport URLs and encoded bytes are excluded from text measurement; provider-specific media token costs are not available locally. Media-shaped business arguments and ordinary strings are counted as text.

Automatic compaction is enabled by default. At 85% of the available input budget, it aims for 65%, preferring to keep the two most recent iterations. A hard overflow can require retaining fewer iterations. The compactor asks an LLM to summarize the discarded conversation, including decisions, external events, confirmed effects, failures, and pending work. Large histories are summarized in bounded segments; each request reserves output space and includes the previous segment's summary.

A successful compaction inserts a `{ role: 'summary', content }` event at the start of the retained transcript. It replaces earlier compaction summaries, preserving their information in the new summary. Native requests receive the summary as labeled user-role data. The summarizer cannot call tools. Summaries are lossy model output; named JavaScript memory stays exact and is never reconstructed from them.

```ts
import { Client } from '@botpress/client'
import { Session } from 'llmz'

const client = new Client()
const session = new Session({
  compaction: {
    triggerRatio: 0.85,
    targetRatio: 0.65,
    keepRecentIterations: 2,
    maxSummaryTokens: 1024,
    model: 'fast',
  },
})

// Read-only: returns a summary message without changing the conversation.
const summary = await session.summarize({ client })

// Replace older history now, preserving the most recent iteration.
await session.compact({ client, keepRecentIterations: 1 })
console.log(summary, session.transcript)
```

Without an explicit compaction model, automatic summaries use the execution model; standalone `summarize` and `compact` use `fast`. Summary generation makes additional model calls. `maxSummaryTokens` is a ceiling; model limits and remaining request space may reduce it. `signal` cancels explicit summarization or compaction.

Set `compaction: false` to disable automatic summarization; requests that cannot fit then fail without dropping history. A custom `compaction.summarize({ messages, maxTokens, signal })` can return summary text; the same validation and token limit still apply. Serializable controls survive `toJSON()` / `fromJSON()`. Reattach a custom callback with `Session.fromJSON(state, { compaction: { ...controls, summarize } })`.

Compaction retains complete call/result groups, current-turn input, pending iterations, queued input, and named memory. Discarded iteration results are removed from `$iterations` and `$return`. Summary failure, cancellation, an oversized summary, or a failing `onBeforeRequest` hook leaves the original history intact. A prepared summary is committed only after the final request fits and its hooks succeed. Explicit `compact` and `summarize` acquire the session lock and cannot overlap execution.

For deliberate deletion without summarization, `session.prune(retainedIterationIds)` keeps the specified complete iterations. `requestMessages({ retainedIterationIds })` previews that selection. Use these lower-level methods only when discarding history is intentional.

If required instructions, current input, tool definitions, or retained memory previews still exceed the budget, shorten them or use a larger context limit. LLMZ does not silently truncate current user input.

`result.tokens` reports provider usage summed over this run. Each iteration's `tokens.context` describes the measured request after compaction and hook replacement; its categories sum to `context.total`. These estimates and provider usage have different purposes.

## Inspection

Use `truncate` in a tool handler to set a value's display budget while retaining its full data:

```ts
import { z } from '@bpinternal/zui'
import { Tool, truncate } from 'llmz'

const getEvidence = new Tool({
  name: 'getEvidence',
  output: z.string(),
  handler: async () =>
    truncate({
      value: 'First section\nDetailed evidence\nLast section',
      maxTokens: 800,
      preserve: 'both',
    }),
})
```

`preserve` is `top`, `bottom`, or `both`. Budgets are nonnegative safe integers; zero hides the preview. `options.toolResultMaxTokens` defaults to 2,000 and accepts 0–2,000. An explicit `truncate` policy can raise or lower the inspected result budget. It cannot bypass the overall request limit. Tool-result preview budgets do not cap the entire execution report, which also contains status and activity.

Inventories and diagnostic previews keep their own small budgets even if a value carries a larger inspection override. Truncation markers are included in the final measured output. Unicode boundaries, cyclic structures, throwing formatters, and accessor properties are handled without changing retained data.

Standalone text is displayed directly. Strings nested in objects or arrays use JSON quoting so source indentation, line endings, and literal escapes remain distinct from the preview's formatting.

`onInspect` customizes previews by purpose and identity. Return `undefined` for the default formatter. The hook receives an isolated read-only snapshot; custom text is still bounded. A formatter failure falls back to default inspection.

```ts
import { createInspector, inspect, type ExecutionHooks } from 'llmz'

const hooks: ExecutionHooks = {
  onInspect: (event) => {
    if (event.purpose === 'variable' && event.identity?.variable === 'apiKey') {
      return '[redacted]'
    }
    return undefined
  },
}
const inspector = createInspector(hooks.onInspect)
console.log(inspector({ count: 3 }, { purpose: 'result', maxTokens: 40 }))
console.log(inspect({ count: 3 }, undefined, { tokens: 40, compact: true }))
```

A redacted preview is not a security boundary: the underlying value still exists in memory and can be used by JavaScript or tools. Keep secrets out of model-accessible state.

## Hooks

| Hook                           | Purpose                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `onIterationStart`             | Observe the iteration before generation. Use getters for dynamic configuration.                     |
| `onBeforeRequest`              | Return replacement native messages after tentative compaction. The replacement must fit the budget. |
| `onBeforeExecution`            | Optionally return replacement JavaScript code.                                                      |
| `onBeforeTool` / `onAfterTool` | Inspect or replace a business tool's input/output.                                                  |
| `onInspect`                    | Format bounded previews without changing retained values.                                           |
| `onTrace`                      | Observe execution traces. Observer exceptions do not alter completed actions.                       |
| `onIterationEnd`               | Observe a settled iteration.                                                                        |
| `onExit`                       | Validate or handle a proposed completion.                                                           |

```ts
import type { ExecutionHooks } from 'llmz'

const hooks: ExecutionHooks = {
  onBeforeRequest: ({ messages }) => ({
    messages: [{ role: 'system', content: 'Use concise language.' }, ...messages],
  }),
  onTrace: ({ trace }) => {
    console.debug(trace.type)
  },
}
```

Request messages are copies. Hooks should preserve native call/result pairing and opaque provider fields. `onBeforeRequest` changes the model request, not canonical session history. Blocking hook failures can fail the iteration; observation hooks have the behavior documented by their types.

## Runtime configuration

`options.loop` bounds model iterations; `options.timeout` bounds JavaScript execution. Supply `signal` to cancel a run. Cancellation preserves completed effects and any values captured before interruption.

`model` can be a model ID, an ordered fallback list, or a dynamic getter. `options.maxTimeToFirstToken` and `midStreamFallback` apply to streaming clients. `options.transcriptionModel` selects transcription for audio on models without native audio support.

On platforms that prohibit runtime WASM compilation, configure a compatible QuickJS variant with `configureQuickJS` and a precompiled tokenizer with `configureTokenizer` before execution. [Examples](./examples) show host integration patterns.

## Migrating from the previous API

| Previous API                                                           | Current replacement                                                                 |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Chat.transcript` or `execute.messages`                                | `session.append(...)`, then `execute({ session, ... })`.                            |
| `Chat.handler`, `onMessageDelta`                                       | `response.handler`, `response.onDelta`; rich messages use component handlers.       |
| Snapshot signals, snapshot results, `execute.snapshot`                 | Persist settled sessions. Durable paused-program resumption is no longer supported. |
| Persisting `ExecutionResult` as conversation state                     | `session.toJSON()` and `Session.fromJSON(...)`.                                     |
| `Example`, `execute.examples`, response examples                       | Put guidance in instructions, or supply request messages with `onBeforeRequest`.    |
| Component aliases, generated method normalization, generation metadata | Exact component names with object or array props.                                   |
| `utils.wrapContent`, legacy truncation helpers                         | `truncate({ value, maxTokens, preserve })`.                                         |
| Returning iteration mutations from `onIterationStart`                  | Dynamic configuration getters or `onBeforeRequest`.                                 |

Stored state has explicit format versions. Migration from older serialized state is not automatic. Rebuild supported session inputs from your application's authoritative conversation records when upgrading.
