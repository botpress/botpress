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
return { action: 'done', result: ticketId }
```

**Why this works:**

- LLMs have seen billions of lines of TypeScript—they're exceptionally good at it
- Complex logic (loops, conditionals, error handling) happens in one inference
- Multiple tool calls execute synchronously without LLM roundtrips
- Full type safety via Zui schemas and TypeScript inference

**Real-world impact**: Anthropic reduced agent costs by 98.7% using code execution patterns ([source](https://www.anthropic.com/engineering/code-execution-with-mcp)).

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

**Generated code:**

```typescript
let sum = 0
for (let i = 14; i <= 1078; i++) {
  if (i % 3 === 0 || i % 9 === 0 || i % 5 === 0) {
    sum += i
  }
}
return { action: 'done', value: { success: true, result: sum } }
```

### Chat Mode: Interactive Agents

```typescript
import { execute } from 'llmz'
import { Text, Button } from './components'

const tools = [searchFlights, bookTicket, cancelBooking]

let state = { transcript: [] }

while (true) {
  const result = await execute({
    client,
    tools,
    chat: {
      transcript: state.transcript,
      components: { Text, Button },
    },
  })

  if (result.is('listen')) {
    // Agent yielded UI and is waiting for user input
    console.log('Agent:', result.value.components)
    const userInput = await getUserInput()
    state.transcript.push({ role: 'user', content: userInput })
  } else {
    // Agent completed the task
    break
  }
}
```

**Generated code:**

```typescript
const flights = await searchFlights({ from: 'SFO', to: 'NYC' })

yield (
  <Text>
    Found {flights.length} flights. Cheapest is ${flights[0].price}. Book it?
  </Text>
)
yield <Button>Book Flight</Button>
yield <Button>Cancel</Button>

return { action: 'listen' }
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
  chat: {
    transcript: conversationHistory,
    components: { Text, Button, Form },
  },
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

Tools are exposed to agents with full TypeScript signatures. Agents call them like regular async functions.

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
  console.log('Booked:', result.value.ticketId) // Fully typed
}
```

Agents use exits via return statements:

```typescript
return {
  action: 'ticket_booked',
  ticketId: 'TKT-12345',
  price: 299,
  confirmation: 'ABC123',
}
```

---

## Advanced Features

### Thinking: Forced Reflection

Prevent agents from rushing to conclusions:

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

Agents can also self-initiate thinking:

```typescript
// Agent-generated code
const data = await fetchLargeDataset()
return { action: 'think' } // Pause to process information
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
  hooks: {
    onTrace: (trace) => {
      // Non-blocking: log tool calls, errors, outputs
      logger.info(trace)
    },
    onExit: (exit) => {
      // Validate before allowing exit
      if (exit.action === 'transfer_money' && exit.amount > 10000) {
        throw new Error('Amount exceeds limit')
      }
    },
    onBeforeExecution: (code) => {
      // Inspect/modify generated code before execution
      if (code.includes('dangerousOperation')) {
        throw new Error('Blocked unsafe operation')
      }
    },
  },
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
- **Observable**: Comprehensive tracing and error handling

---

## Architecture

**Execution Pipeline:**

1. **Prompt Generation**: Injects tools, schemas, and context into dual-mode prompts
2. **Code Generation**: LLM generates TypeScript with tool calls and logic
3. **Compilation**: Babel AST transformation with custom plugins (tracking, JSX, source maps)
4. **Execution**: Runs in QuickJS WASM sandbox with full isolation
5. **Result Processing**: Type-safe exit handling and error recovery

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
| Execution environment    | Python/JS runtime      | Cross-process          | QuickJS WASM sandbox      |
| Cost (complex workflows) | High (many roundtrips) | High (many roundtrips) | Low (one-shot generation) |
| Production scale         | Varies                 | Emerging               | Battle-tested (1M+ users) |

---

## Examples

Check out the [examples folder](https://github.com/botpress/botpress/tree/master/packages/llmz/examples) for complete working examples:

| Title                                                                                                                 | Mode   | Description                                          |
| --------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------- |
| [Basic Chat](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/01_chat_basic)                   | Chat   | Simple interactive chat with button-based navigation |
| [Chat with Exits](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/02_chat_exits)              | Chat   | Custom exit conditions with type-safe validation     |
| [Conditional Tools](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/03_chat_conditional_tool) | Chat   | Dynamic tool availability based on context           |
| [Small Models](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/04_chat_small_models)          | Chat   | Optimized prompts for smaller language models        |
| [Web Search](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/05_chat_web_search)              | Chat   | Integrate web search and content browsing            |
| [Tool Confirmation](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/06_chat_confirm_tool)     | Chat   | User confirmation before executing tools             |
| [Guardrails](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/07_chat_guardrails)              | Chat   | Safety constraints and content filtering             |
| [Multi-Agent](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/08_chat_multi_agent)            | Chat   | Coordinating multiple agents in one system           |
| [Variables](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/09_chat_variables)                | Chat   | Stateful properties that persist across iterations   |
| [Components](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/10_chat_components)              | Chat   | Rich UI components for interactive experiences       |
| [Minimal Worker](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/11_worker_minimal)           | Worker | One-shot computational task execution                |
| [File System](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/12_worker_fs)                   | Worker | Automated file operations with conditional logic     |
| [Sandbox](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/13_worker_sandbox)                  | Worker | Secure isolated code execution environment           |
| [Snapshots](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/14_worker_snapshot)               | Worker | Pause and resume long-running workflows              |
| [Stack Traces](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/15_worker_stacktraces)         | Worker | Error handling and debugging patterns                |
| [Tool Chaining](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/16_worker_tool_chaining)      | Worker | Sequential multi-tool orchestration                  |
| [Error Recovery](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/17_worker_error_recovery)    | Worker | Graceful failure handling and retries                |
| [Security](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/18_worker_security)                | Worker | Code inspection and security validation              |
| [Wrap Tools](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/19_worker_wrap_tool)             | Worker | Creating higher-order tool abstractions              |
| [RAG](https://github.com/botpress/botpress/tree/master/packages/llmz/examples/20_chat_rag)                            | Chat   | Retrieval-augmented generation with knowledge bases  |

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
