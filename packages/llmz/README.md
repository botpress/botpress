# LLMZ

LLMZ runs agents that use JavaScript to call tools, work with data, and return typed outcomes. The model receives one native `run_javascript` tool. Programs run in a sandbox; the host supplies the business tools they can call.

Use `Session` for conversation history and retained values, `Chat` for text and component delivery, and `Exit` for structured completion.

[API guide](./DOCS.md) · [Examples](./examples) · [Migration](./DOCS.md#migrating-from-the-previous-api)

## Installation

```sh
pnpm add llmz @botpress/cognitive @bpinternal/zui @bpinternal/thicktoken
```

The following examples assume `BOTPRESS_BOT_ID` and `BOTPRESS_TOKEN` are configured for Cognitive. Examples are type-checked with `pnpm check:docs`.

## Start a conversation

```ts
import { Cognitive } from '@botpress/cognitive'
import { Chat, Session, execute } from 'llmz'

const client = new Cognitive({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const session = new Session()
const chat = new Chat({
  response: {
    preset: 'markdown',
    handler: (text) => {
      console.log(text)
    },
  },
})

session.append({ role: 'user', content: 'Help me plan a weekend in Montreal.' })
const result = await execute({ client, session, chat, instructions: 'Be concise and helpful.' })

if (result.isError()) {
  console.error(result.error)
}
```

Append the next message and call `execute` again with the same session. Inputs appended during execution wait for the next turn. Await one execution before starting another on that session.

## Return a typed result

Workers complete through a named exit. Tool input and exit output use Zui schemas.

```ts
import { Cognitive } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { Exit, Tool, execute } from 'llmz'

const client = new Cognitive({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const getPrice = new Tool({
  name: 'getPrice',
  description: 'Look up the unit price of an item.',
  input: z.object({ sku: z.string() }),
  output: z.number(),
  handler: async ({ sku }) => (sku === 'coffee' ? 12 : 0),
})
const done = new Exit({
  name: 'done',
  description: 'Return the calculated total.',
  schema: z.object({ total: z.number() }),
})

const result = await execute({
  client,
  instructions: 'Calculate the price of three units of coffee and finish with done.',
  tools: [getPrice],
  exits: [done],
})

if (result.is(done)) {
  console.log(result.output.total)
} else if (result.isError()) {
  console.error(result.error)
}
```

The model can compose tool calls in a program. It uses `return inspect(value)` to examine evidence in another iteration, and `return exit('done', payload)` to finish. [Execution and memory](./DOCS.md#execution-and-memory) explains their lifetimes.

## Save a conversation

Persist the session after execution settles. The execution result contains the outcome and diagnostics for one run.

```ts
import { Session } from 'llmz'

const session = new Session({ variables: { accountId: 'customer-42' } })
session.append({ role: 'user', content: 'Check my account.' })

const saved = JSON.stringify(session.toJSON())
const restored = Session.fromJSON(JSON.parse(saved))

console.log(restored.pendingMessages)
console.log(restored.memory.variables.accountId)
```

A failed execution retains its active turn. Calling `execute` again continues that turn; newly queued input remains separate. Completed tool effects are not rolled back. [Persistence and recovery](./DOCS.md#persistence-and-recovery) documents this contract.

## Stream text

`onDelta` receives provisional text. `handler` receives the complete accepted response. A restart retracts the preview for that iteration.

```ts
import { Chat } from 'llmz'

const previews = new Map<string, string>()
const chat = new Chat({
  response: {
    preset: 'text',
    onDelta: (event) => {
      if (event.restart) {
        previews.delete(event.iterationId)
      } else {
        previews.set(event.iterationId, event.content)
      }
    },
    handler: (text, metadata) => {
      previews.delete(metadata.iterationId)
      console.log(metadata.id, text)
    },
  },
})
```

Streaming requires a client with `generateTextStream`. See [streaming semantics](./DOCS.md#streaming-and-delivery) before enabling model fallback.

## Examples and development

- [Basic chat](./examples/01_chat_basic/index.ts)
- [Typed chat exits](./examples/02_chat_exits/index.ts)
- [Rich components](./examples/10_chat_components/index.ts)
- [Worker tool chaining](./examples/16_worker_tool_chaining/index.ts)
- [Streaming chat](./examples/22_chat_streaming/index.ts)

```sh
pnpm test
pnpm check:type
pnpm check:docs
pnpm check:lint
pnpm check:format
```

Unit tests use scripted clients. Model evaluations run separately through `pnpm test:e2e` and require the configured provider credentials.
