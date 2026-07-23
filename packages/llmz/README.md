# LLMz

**Stop chaining tools. Start generating code.**

LLMz is a TypeScript AI agent framework that replaces traditional JSON tool calling with executable code generation. Instead of orchestrating tools through multiple LLM roundtrips, agents write and execute TypeScript directly—enabling complex logic, loops, and multi-tool coordination in a single pass.

Powers millions of production agents at [Botpress](https://botpress.com).

|     |                                                                                           |
| --- | ----------------------------------------------------------------------------------------- |
| 📚  | [**Examples →**](https://github.com/botpress/botpress/tree/master/packages/llmz/examples) |

---

## The Problem with Tool Calling

Traditional agentic frameworks (LangChain, CrewAI, MCP servers) rely on JSON tool calling:

```json
{
  "tool": "getTicketPrice",
  "parameters": { "from": "quebec", "to": "new york" }
}
```

This breaks down quickly:

- **Verbose schemas**: LLMs struggle with complex JSON structures
- **No logic**: Can't express conditionals, loops, or error handling
- **Multiple roundtrips**: Each tool call requires another LLM inference ($$$)
- **Fragile composition**: Chaining tools is error-prone and expensive

You end up with brittle agents that cost 10-100x more than they should.

---

## The LLMz Solution

LLMz generates and executes **real TypeScript code** in a secure sandbox:

```typescript
const price = await getTicketPrice({ from: 'quebec', to: 'new york' })

if (price > 500) {
  throw new Error('Price too high')
}

const ticketId = await buyTicket({ from: 'quebec', to: 'new york' })
```

**Why this works:**

- LLMs have seen billions of lines of TypeScript—they're exceptionally good at it
- Complex logic (loops, conditionals, error handling) happens in one inference
- Multiple tool calls execute synchronously without LLM roundtrips
- Full type safety via Zui schemas and TypeScript inference

**Real-world impact**: Anthropic reduced agent costs by 98.7% using code execution patterns ([source](https://www.anthropic.com/engineering/code-execution-with-mcp)).

---

## The ■ Protocol

Every model response is a sequence of streaming-native `■` blocks:

```
■send=message
Let me check the next launch dates for the Moon...
■run
const dates = await checkAvailability({ destination: 'moon' })
const reservation = await bookTrip({ destination: 'moon', date: dates[0], travelerName: 'Ada' })
const payment = await processPayment({ reservationId: reservation.reservationId })
return { ...payment, date: dates[0] }
```

- **`■send=<component> {props?}`** — sends a message to the user, delivered (and streamable) the moment it is parsed
- **`■run`** — executes the TypeScript body in the sandbox; the returned value is fed back to the model
- **`■next=<exit> {props?}`** — ends the turn through a typed exit (the built-in `listen` hands the turn back to the user)

Because the protocol is parsed incrementally, messages stream to your UI token-by-token, tool calls surface live, and code execution can start before the response has even finished streaming.

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

**Generated response:**

```
■run
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

  // Complete messages, delivered as soon as they are parsed
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

```
■send=message
Found 12 flights. The cheapest is **$249**. Want me to book it?
■send=button {"label": "Book flight", "action": "postback", "value": "book"}
■send=button {"label": "Cancel", "action": "postback", "value": "cancel"}
■next=listen
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

Tools are exposed to agents with full TypeScript signatures. Agents call them like regular async functions — and chain them freely inside a single `■run` block.

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

Agents invoke exits with a `■next` block:

```
■next=ticket_booked {"ticketId": "TKT-12345", "price": 299, "confirmation": "ABC123"}
```

---

## Streaming

With a streaming client (`CognitiveBeta` / Cognitive v2), everything an execution produces surfaces in real time:

```typescript
const chat = new Chat({
  components: [DefaultComponents.Text],
  transcript: () => transcript,
  handler: async (component) => finalizeBubble(component),
  // Fires per token-chunk while the LLM is still generating
  onMessageDelta: (delta) => appendToBubble(delta.id, delta.delta),
})

const result = await execute({
  client, // CognitiveBeta
  chat,
  tools,
  onTrace: ({ trace }) => {
    if (trace.type === 'llm_call_started') showSpinner()
    if (trace.type === 'code_generation_started') showStatus('writing code…')
    if (trace.type === 'llm_call_success') showCode(trace.code)
    if (trace.type === 'tool_call') showToolCall(trace)
  },
})
```

- **Message deltas** stream to your UI token-by-token (`handler` remains the authoritative delivery)
- **Live traces** cover the full turn lifecycle: `llm_call_started` → message deltas → `code_generation_started` → `llm_call_success` (with the code) → `tool_call`s → exit
- **Early execution**: the `■run` block starts executing while the tail of the response is still streaming, and the VM pre-warms the moment the model starts writing code

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

```
■run
const data = await fetchLargeDataset()
return data.summary
```

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

---

## Coming from MCP?

LLMz is **not** a replacement for MCP—it's complementary.

**MCP** (Model Context Protocol): Standardizes how AI applications connect to data sources and tools across processes/machines.

**LLMz**: Replaces the execution pattern _after_ tools are exposed. Instead of making multiple LLM calls to orchestrate MCP tools via JSON, LLMz generates TypeScript code that calls those same tools in a single inference—reducing costs by up to 98%.

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
2. **Streaming Generation**: The LLM streams ■ blocks — messages dispatch to the chat as they are parsed
3. **Compilation**: Babel AST transformation with instrumentation plugins (line tracking, tool call tracking, variable extraction)
4. **Execution**: Runs in QuickJS WASM sandbox with full isolation — starting while the response tail is still streaming
5. **Result Processing**: Type-safe exit handling, thinking loops and error recovery

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
| Tool calling             | JSON                   | JSON                   | TypeScript code           |
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
