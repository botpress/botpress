# LLMz

**Stop chaining tools. Start generating code.**

LLMz uses native assistant messages and tool calling, with JavaScript execution for business logic. Models call the single native tool `run_javascript` to chain business functions, compute, inspect results, reuse variables, present rich messages, and complete through typed exits.

Powers millions of production agents at [Botpress](https://botpress.com).

|     |                                                                                           |
| --- | ----------------------------------------------------------------------------------------- |
| 📚  | [**Examples →**](https://github.com/botpress/botpress/tree/master/packages/llmz/examples) |

---

## Native conversation, JavaScript orchestration

Text replies are ordinary assistant messages. Business operations run through one native tool:

```javascript
run_javascript({
  code: `
    const account = await readAccount()

    const orders = await listOrders({ accountId: account.id })

    return { account, orderCount: orders.length }
  `,
})
```

This illustrates a native tool call. The program inside `code` runs in the VM.

The return preview and created/updated variables arrive as a native tool result. The next assistant response can answer from that evidence. A program can instead use `return exit(name, payload)` to complete with a typed result, or return `inspect(value)` to explicitly request another response. Generated programs use JavaScript; TypeScript declarations document the available functions and objects.

For rich content, the assistant can stream “Which plan would you like?” normally and make one native call containing:

```js
return chat.buttons([
  { action: 'say', label: 'Standard' },
  { action: 'say', label: 'Premium' },
])
```

The returned decision validates the complete presentation batch, settles memory, delivers the buttons in order, and finishes with `ListenExit`. Returning `chat.present({ messages })` supports other registered components. Use `await chat.send(messageOrArray)` for progress that continues execution, `return exit()` to wait silently, and `return exit('done', payload)` for typed completion. Keep using `return exit(...)`; if return is omitted, the exit call still stops JavaScript. Presentation builders still need to be returned.

Use `Promise.all` inside the program for independent business operations. Native parallel calls are disabled. Plain JavaScript values, including `undefined`, retain the existing nonterminal inspection behavior; terminal receipts do not replace `$return`.

Assistant text streams provisionally. A validated, complete structured tool call can start JavaScript while the response stream remains open; partial arguments never execute. Both streaming and JavaScript must settle before the next iteration. If streaming fails after execution starts, LLMz preserves completed effects and memory and stops without automatically replaying the program. There are no response markers or protocol stop sequences.

## Session memory

Reuse a `Session` across user turns to preserve canonical native history and exact captured values:

```typescript
import { Session, execute } from 'llmz'

const session = new Session()
await execute({ client, chat, session, messages: [{ role: 'user', content: 'Find my account.' }] })
await execute({ client, chat, session, messages: [{ role: 'user', content: 'How many orders does it have?' }] })

// Persist both native history and values; display previews cannot restore full memory.
const saved = session.toJSON()
const restored = Session.fromJSON(saved)
```

Inside JavaScript, named variables remain loaded. `$return` is the latest successful result; `$iterations[0]` is the most recent settled iteration, including iterations without a JavaScript result. Its `hasResult` distinguishes a successful `undefined` return from no result. Automatic history follows transcript compaction; named variables survive.

Declare new retained variables at top level with `const` or `let`. Bare assignment updates an existing binding; it does not create one. If assignment fails after a tool completed, use the recorded result to repair the variable without repeating the tool's work.

The final model input includes a fresh, compact Memory overview with usable names, previews, and assignment ages. Each JavaScript tool result reports created and updated variables. These reports are metadata, separate from the actual return value.

See the [native protocol specification](docs/native-protocol-spec.md) and [major-version migration guide](docs/native-protocol-migration.md), including provider and persistence boundaries.

## Native model evaluations

For a standalone Cognitive tool-call smoke test (no LLMz runtime), set `CLOUD_PAT` and `CLOUD_BOT_ID`, then run:

```bash
pnpm test:cognitive
```

This discovers all current text models through `Cognitive.listModels()` and runs two scenarios in streaming and nonstreaming mode: a single `record_number({ value: 42 })` call, then a response containing both that call and `record_label({ label: 'ready' })`. The multi-tool scenario enables parallel calls and checks both names, exact arguments, and distinct nonempty call IDs, regardless of order. Both calls must appear in the same response; there is no tool execution or follow-up model request.

The catalog includes preview, deprecated, and reasoning variants; speech, image, and discontinued models are excluded with a printed reason. Requests run sequentially with required tool calling, a 1,600-token output budget, and a 60-second timeout. Narrow the run with comma-separated `COGNITIVE_TEST_MODELS`; explicit selections bypass catalog filtering. Optionally set `CLOUD_API_ENDPOINT`. The test loads `.env` and prints response diagnostics.

Each response has separate checks for native tool-call correctness and the fresh requested route. A correct call served by Bedrock or a fallback passes the tool check but fails the route check; it does not establish support on the originally requested provider. Parent tests fail when either check fails. A failed probe only describes these settings, rather than proving a model cannot call tools under other settings.

With `CLOUD_PAT` and `CLOUD_BOT_ID` configured, run first-response checks without runtime repair:

```bash
LLMZ_EVAL_MODELS=openai:gpt-5.6-luna LLMZ_EVAL_REPEATS=1 pnpm test:e2e e2e/protocol-matrix.test.ts
```

The matrix covers 144 tasks across 12 languages in streaming and nonstreaming mode, including tool results, buttons, worker exits, and recovery. Each completed response is replayed once through the isolated VM with local fixtures to check actual business calls, presentations, inspected results, and typed completion; it never asks the provider for a repair response. These opt-in live tests measure provider behavior; deterministic unit tests do not establish a model success rate.

The [full evaluation report](docs/native-protocol-full-evaluation.md) separates the complete single-tool baseline, targeted corrections, and exit-control-flow checks. It reports native-call validity and task completion separately; the broader behavioral suite is not entirely green. The [earlier report](docs/native-protocol-rerun.md) preserves the preceding multiple-native-tools comparison. Session persistence, compaction, and snapshot continuation have a separate opt-in suite in `e2e/native-session.test.ts`.

For a small current-protocol sample, run `e2e/single-tool.test.ts` with the same evaluation configuration. Its four cases check typed completion in both delivery modes, streamed assistant text plus two buttons in one generation, and inspection followed by an answer in two generations. Calls must use the requested uncached model, the sole `run_javascript` tool, and no provider restart. Examples prefer `return exit(...)`; deterministic VM tests also require correct completion when `return` is omitted.

---

## Long search results and citations

The RAG benchmark uses the same citation contract as VDK: a search tool registers source metadata, returns passages labelled with `【id】` through `ThinkSignal`, and the completed message handler extracts inline tags into citation metadata with text offsets. Its documents are entirely synthetic.

```bash
LLMZ_EVAL_MODELS=groq:qwen3.8-27b LLMZ_EVAL_REPEATS=1 pnpm test:e2e e2e/long-search-citations.test.ts
```

The 48 cases pair compact controls with long corpora in both streaming modes. They cover exact scope matching, superseded/future policies, joins across distant documents, and quota arithmetic, with answers near the beginning, middle, or end. Results span roughly 12,000–39,000 tokens and four response languages. Tests require correct facts, every required supporting source, no unrelated citations, intact evidence in the actual model request, no extra search/recovery hops, and the requested model without cache or fallback credit. Near-match sources may additionally support scope/date disambiguation (for example, explaining why an archived account does not apply); they cannot replace required evidence. These checks validate retrieval and source coverage, not every possible natural-language claim.

Latest tool-result strings are preserved until the request context budget is applied; they are no longer silently clipped at 4,096 characters. Inputs exceeding the model/context budget still undergo normal truncation. Separate deterministic tests cover citation offsets, grouped/repeated tags, structured component props, chunk boundaries, discarded preambles, stream restarts, failed delivery, and unknown source IDs.

---

## Quick Start

**Requirements:** Node.js 20+

```bash
npm install @botpress/client llmz
```

### Platform Support

| Platform           | Support |
| ------------------ | ------- |
| Node.js 20+        | ✅ Full |
| Browser            | ✅ Full |
| AWS Lambda         | ✅ Full |
| Cloudflare Workers | ✅ Full |
| Bun                | ✅ Full |
| Deno               | ✅ Full |

#### Sandbox Execution

LLMz uses **QuickJS** (a lightweight JavaScript engine compiled to WebAssembly) to execute generated code in a secure, isolated sandbox. This provides:

- **Complete isolation**: No access to filesystem, network, or host environment
- **Memory limits**: Configurable heap size to prevent resource exhaustion
- **Execution timeouts**: Automatic termination of runaway code
- **Abort signals**: Support for programmatic execution cancellation
- **Universal compatibility**: Works everywhere WebAssembly is supported

The QuickJS sandbox is bundled as a singlefile variant with WASM inlined as base64, so it works out-of-the-box with any bundler (esbuild, webpack, vite, rollup) without configuration.

### Worker Mode: Autonomous Execution

```typescript
import { Client } from '@botpress/client'
import { execute } from 'llmz'

const client = new Client({ botId: '...', token: '...' })

const result = await execute({
  instructions: 'Calculate sum of integers 14-1078 divisible by 3, 9, or 5',
  client,
})

console.log(result.output) // 271575
```

**JavaScript supplied to `run_javascript`:**

```javascript
let sum = 0

for (let i = 14; i <= 1078; i++) {
  if (i % 3 === 0 || i % 9 === 0 || i % 5 === 0) {
    sum += i
  }
}

return sum
```

### Chat Mode: Interactive Agents

```typescript
import { execute, Chat, DefaultComponents, ListenExit } from 'llmz'

const transcript = []

const chat = new Chat({
  components: [DefaultComponents.Text, DefaultComponents.Button],
  transcript: () => transcript,

  // Complete messages, delivered after successful generation and validation
  handler: async (component) => {
    render(component)
  },

  // Optional: message body chunks, streamed while the LLM is still generating
  onMessageDelta: (delta) => {
    appendToBubble(delta.id, delta.delta)
  },
})

while (true) {
  const result = await execute({ client, chat, tools: [searchFlights, bookTicket] })

  if (result.is(ListenExit)) {
    // Agent handed the turn back — wait for user input
    transcript.push({ role: 'user', content: await getUserInput() })
  } else {
    break // Agent completed (custom exit) or errored
  }
}
```

**Generated response:**

The assistant replies normally: “Found 12 flights. The cheapest is **$249**. Want me to book it?” Its one `run_javascript` call contains:

```js
return chat.buttons([
  { label: 'Book flight', action: 'postback', value: 'book' },
  { label: 'Cancel', action: 'postback', value: 'cancel' },
])
```

---

## Core Concepts

### Execution Modes

**Worker Mode**: Autonomous agents that execute to completion

```typescript
const result = await execute({
  instructions: 'Analyze Q4 sales data and generate report',
  client,
  tools: [fetchSales, calculateMetrics, generatePDF],
})
```

**Chat Mode**: Interactive conversations with user input

```typescript
const result = await execute({
  client,
  tools,
  chat, // a Chat instance: components + transcript + message handler
})
```

### Tools: Type-Safe Functions

```typescript
import { Tool } from 'llmz'
import { z } from '@bpinternal/zui'

const searchFlights = new Tool({
  name: 'searchFlights',
  description: 'Search for available flights',
  input: z.object({
    from: z.string(),
    to: z.string(),
    date: z.string(),
  }),
  output: z.array(
    z.object({
      id: z.string(),
      price: z.number(),
      departure: z.string(),
    })
  ),
  handler: async ({ from, to, date }) => {
    // Your implementation
    return flights
  },
})
```

Tools are exposed to agents with full TypeScript signatures. Agents call them like regular async functions — and chain them freely inside a single `run_javascript` call.

Tool handlers can also be **async generators** that push UI components to the chat mid-execution (progress bars, previews) before returning their result — see [example 21](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/21_chat_tool_components).

### Objects: Namespaced State

Group related tools and variables:

```typescript
import { ObjectInstance } from 'llmz'
import { z } from '@bpinternal/zui'

const database = new ObjectInstance({
  name: 'db',
  description: 'Database operations',
  tools: [queryUsers, updateRecord, deleteRecord],
  properties: [
    {
      name: 'connectionString',
      value: process.env.DB_URL,
      writable: false,
    },
    {
      name: 'lastQueryTime',
      value: null,
      type: z.string().nullable(),
      writable: true,
    },
  ],
})
```

Agents access via namespaces:

```typescript
const users = await db.queryUsers({ active: true })
db.lastQueryTime = new Date().toISOString()
```

### Exits: Structured Termination

Define how agents can complete:

```typescript
import { Exit } from 'llmz'
import { z } from '@bpinternal/zui'

const TicketBooked = new Exit({
  name: 'ticket_booked',
  description: 'Successfully booked a ticket',
  schema: z.object({
    ticketId: z.string(),
    price: z.number(),
    confirmation: z.string(),
  }),
})

const result = await execute({
  client,
  tools,
  exits: [TicketBooked],
})

if (result.is(TicketBooked)) {
  console.log('Booked:', result.output.ticketId) // Fully typed
}
```

Agents should complete with `return exit(...)`; the VM also stops at a valid exit if return is omitted:

```js
return exit('ticket_booked', {
  ticketId: 'TKT-12345',
  price: 299,
  confirmation: 'ABC123',
})
```

In chat mode, a known outcome matching a registered exit should use that exit, even when the response also contains assistant text. Text alone completes through `listen`; an apology does not select a cancellation exit.

---

## Streaming

With a streaming client (`CognitiveBeta` / Cognitive v2), provisional assistant text streams while generation is in progress:

```typescript
const chat = new Chat({
  components: [DefaultComponents.Text],
  transcript: () => transcript,
  handler: async (component, metadata) => finalizeBubble(component, metadata),
  // Fires per token-chunk while the LLM is still generating
  onMessageDelta: (delta) => {
    if (delta.restart) {
      // Remove this iteration's provisional previews.
      return clearIterationMessages(delta.iterationId)
    }

    return updateBubble(delta.iterationId, delta.id, delta.content)
  },
})

const result = await execute({
  client, // CognitiveBeta
  chat,
  tools,
  options: { midStreamFallback: true },
  onTrace: ({ trace }) => {
    if (trace.type === 'llm_call_started') {
      showSpinner()
    }

    if (trace.type === 'llm_call_success') {
      showCode(trace.code)
    }

    if (trace.type === 'tool_call') {
      showToolCall(trace)
    }
  },
})
```

- **Message deltas** stream to your UI token-by-token (`handler` remains the authoritative delivery)
- **Live traces** expose generation, message deltas, inner business calls, and completion. `llm_call_success` includes the generated code; business calls can overlap the remaining stream.
- **Fallback**: before execution starts, a `restart: true` delta retracts provisional text and replacement messages receive fresh IDs. After execution starts, a stream failure or restart ends the iteration without automatically replaying its effects.
- **Execution**: a complete validated structured call can start JavaScript before transport closes. The next iteration waits for both the stream and the program. Cognitive currently emits calls in its final chunk, so overlap is usually with transport draining; adapters that expose complete calls earlier can start sooner.

Terminal failures return an `ErrorExecutionResult` and retract provisional text with a reset delta. Already acknowledged business actions or `chat.send` deliveries remain completed, and retained memory records that progress. Nonstreaming fallback exposes only the surviving response.

Partial argument fragments never authorize execution. Complete structured calls are validated before dispatch; failed final metadata cannot turn an incomplete call into executable code. If failure is discovered after an earlier complete call already started, its effects are preserved and automatic replay is disabled.

Assistant text accompanying a call is a pre-action message. Every completed JavaScript call produces a native tool result, including successful `undefined`. Calling `exit(...)` or returning a presentation decision can complete that same response after memory settlement. Ordinary values and `inspect(value)` continue the model loop.

Forward these events over a websocket or SSE stream and your frontend renders the agent live — see [example 22](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/22_chat_streaming).

### Token Usage & Timings

Every iteration reports what it consumed:

```typescript
const { input, output, total, limit, context } = result.iteration.tokens
// context measures the prompt size by part (pre-truncation):
// { framework, instructions, tools, transcript, protocol, iterations, total }
console.log(`context used: ${Math.round((context.total / limit) * 100)}%`)

const { time_to_first_token, time_to_last_token } = result.iteration.llm

// Aggregated across all iterations:
console.log(result.tokens) // { input, output, total }
```

### Execution Options

```typescript
const result = await execute({
  client,
  model: ['cerebras:gpt-oss-120b', 'anthropic:claude-haiku-4-5'], // fallback chain
  reasoningEffort: 'low', // 'low' | 'medium' | 'high' | 'dynamic' | 'none'
  options: {
    loop: 5, // max iterations
    timeout: 60_000, // VM execution timeout (ms)
    maxTokens: 32_000, // context window cap: min(maxTokens, model max)
    maxTimeToFirstToken: 5_000, // fall back to the next model if the first token is late (ms)
  },
})
```

---

## Advanced Features

### Thinking: Forced Reflection

Tools can force the agent to look at data before acting on it:

```typescript
import { ThinkSignal } from 'llmz'

const complexAnalysis = new Tool({
  name: 'analyze',
  handler: async (data) => {
    const result = performComplexCalculation(data)
    // Force agent to reflect on results before proceeding
    throw new ThinkSignal('Analysis complete. Review data before next step.')
  },
})
```

Agents self-initiate reflection by returning values from their code — the returned value is shown to them and they respond again:

```javascript
const data = await fetchLargeDataset()
return data.summary
```

Host-thrown `ThinkSignal` and `SnapshotSignal` stop generated JavaScript, including surrounding `catch` and `finally` blocks. Completed work and captured variables remain available, and already-started host operations settle before continuation. Ordinary tool errors remain catchable.

### Snapshots: Pause and Resume

Save execution state for long-running workflows:

```typescript
import { SnapshotSignal } from 'llmz'

const approvalRequired = new Tool({
  name: 'submitForApproval',
  handler: async (request) => {
    await saveToDatabase(request)
    // Halt execution until manual approval
    throw new SnapshotSignal('Awaiting manager approval')
  },
})

// Later, resume from snapshot
const result = await execute({
  client,
  snapshot: savedSnapshot,
})
```

### Hooks: Custom Logic Injection

```typescript
const result = await execute({
  client,
  tools,

  // Non-blocking: observe everything (and abort when needed)
  onTrace: ({ trace, controller }) => {
    logger.info(trace)
    if (trace.type === 'tool_call' && trace.tool_name === 'forbidden') {
      controller.abort('Forbidden tool call')
    }
  },

  // Validate before allowing an exit — throw to retry, abort to stop
  onExit: (result, controller) => {
    if (result.exit.name === 'transfer_money' && result.result.amount > 10_000) {
      throw new Error('Amount exceeds limit')
    }
  },

  // Inspect/modify generated code before execution
  onBeforeExecution: (iteration) => {
    if (iteration.code?.includes('dangerousOperation')) {
      return { code: '// blocked' }
    }
  },

  // Also available: onIterationStart, onIterationEnd, onBeforeTool, onAfterTool
})
```

When `onBeforeExecution` replaces the program, the tool result discloses the replacement and actual business-call outcomes. The original assistant call stays intact in history. A replaced `exit(...)` does not complete the task unless the replacement also exits; the model continues from the recorded result and memory.

---

## Coming from MCP?

LLMz is **not** a replacement for MCP—it's complementary.

**MCP** (Model Context Protocol): Standardizes how AI applications connect to data sources and tools across processes/machines.

**LLMz**: Replaces the execution pattern _after_ tools are exposed. Instead of making multiple LLM calls to orchestrate MCP tools via JSON, LLMz generates JavaScript code that calls those same tools in a single inference—reducing costs by up to 98%.

---

## Production Ready

LLMz has been running in production for over a year:

- **Millions** of active users across enterprise and consumer applications
- **Hundreds of thousands** of deployed agents handling real-world workloads
- **Secure sandbox**: Uses QuickJS WASM for isolated code execution
- **Type-safe**: Full TypeScript inference and Zui validation
- **Observable**: Comprehensive tracing, token accounting and error handling

---

## Architecture

**Execution Pipeline:**

1. **Prompt Generation**: Injects tools, schemas, and context into dual-mode prompts
2. **Streaming Generation**: The LLM streams native assistant text; provisional deltas reach the chat immediately
3. **Compilation**: Acorn AST instrumentation for line tracking, tool calls, and variable capture
4. **Execution**: A complete validated structured call runs in the isolated VM while the response stream may still be open
5. **Result Processing**: Waits for streaming and JavaScript settlement before typed completion or the next model response

**Security:**

- QuickJS WASM sandbox with complete isolation (no filesystem/network access)
- Stack trace sanitization (removes internal framework details)
- Configurable memory limits and execution timeouts
- Tool-level permissions and rate limiting
- Automatic token limit handling

---

## Comparison

| Feature                  | LangChain / CrewAI     | MCP Servers            | LLMz                      |
| ------------------------ | ---------------------- | ---------------------- | ------------------------- |
| Tool calling             | JSON                   | JSON                   | JavaScript + native tools |
| Multi-tool orchestration | Multiple LLM calls     | Multiple LLM calls     | Single LLM call           |
| Complex logic            | Limited                | Limited                | Full language support     |
| Type safety              | Partial                | Schema-based           | Full TypeScript + Zui     |
| Streaming                | Text only              | Text only              | Messages, code, tools     |
| Execution environment    | Python/JS runtime      | Cross-process          | QuickJS WASM sandbox      |
| Cost (complex workflows) | High (many roundtrips) | High (many roundtrips) | Low (one-shot generation) |
| Production scale         | Varies                 | Emerging               | Battle-tested (1M+ users) |

---

## Examples

Check out the [examples folder](https://github.com/botpress/botpress/tree/master/packages/llmz/examples) for complete working examples:

| Title                                                                                                                 | Mode   | Description                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| [Basic Chat](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/01_chat_basic)                   | Chat   | Simple interactive chat with button-based navigation                                      |
| [Chat with Exits](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/02_chat_exits)              | Chat   | Custom exit conditions with type-safe validation                                          |
| [Conditional Tools](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/03_chat_conditional_tool) | Chat   | Dynamic tool availability based on context                                                |
| [Small Models](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/04_chat_small_models)          | Chat   | Optimized prompts for smaller language models                                             |
| [Web Search](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/05_chat_web_search)              | Chat   | Integrate web search and content browsing                                                 |
| [Tool Confirmation](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/06_chat_confirm_tool)     | Chat   | User confirmation before executing tools                                                  |
| [Guardrails](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/07_chat_guardrails)              | Chat   | Safety constraints and content filtering                                                  |
| [Multi-Agent](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/08_chat_multi_agent)            | Chat   | Coordinating multiple agents in one system                                                |
| [Variables](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/09_chat_variables)                | Chat   | Stateful properties that persist across iterations                                        |
| [Components](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/10_chat_components)              | Chat   | Rich UI components for interactive experiences                                            |
| [Minimal Worker](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/11_worker_minimal)           | Worker | One-shot computational task execution                                                     |
| [File System](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/12_worker_fs)                   | Worker | Automated file operations with conditional logic                                          |
| [Sandbox](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/13_worker_sandbox)                  | Worker | Secure isolated code execution environment                                                |
| [Snapshots](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/14_worker_snapshot)               | Worker | Pause and resume long-running workflows                                                   |
| [Stack Traces](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/15_worker_stacktraces)         | Worker | Error handling and debugging patterns                                                     |
| [Tool Chaining](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/16_worker_tool_chaining)      | Worker | Sequential multi-tool orchestration                                                       |
| [Error Recovery](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/17_worker_error_recovery)    | Worker | Graceful failure handling and retries                                                     |
| [Security](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/18_worker_security)                | Worker | Code inspection and security validation                                                   |
| [Wrap Tools](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/19_worker_wrap_tool)             | Worker | Creating higher-order tool abstractions                                                   |
| [RAG](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/20_chat_rag)                            | Chat   | Retrieval-augmented generation with knowledge bases                                       |
| [Tool Components](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/21_chat_tool_components)    | Chat   | Tool handlers pushing UI components mid-execution                                         |
| [Streaming](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/22_chat_streaming)                | Chat   | Guided simulation: streamed messages, live code + tool calls, typed exits, per-turn stats |

---

## Contributing

```bash
git clone https://github.com/botpress/botpress
cd packages/llmz

pnpm install
pnpm test
pnpm build
```

**Commands:**

- `pnpm test`: Run test suite (Vitest with LLM retries)
- `pnpm test:watch`: Watch mode for development
- `pnpm build`: Compile TypeScript and bundle (ESM + CJS)
- `pnpm generate`: Regenerate prompt templates from markdown

---

## License

MIT

---

## Learn More

- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [How Code Execution Reduces Agent Costs by 98%](https://medium.com/@meshuggah22/weve-been-using-mcp-wrong-how-anthropic-reduced-ai-agent-costs-by-98-7-7c102fc22589)
- [Botpress Documentation](https://botpress.com/docs)
