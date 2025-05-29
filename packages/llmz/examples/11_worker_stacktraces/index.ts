import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit, Tool } from 'llmz'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const demo = new Tool({
  name: 'demo',
  async handler() {
    throw new Error('This is a demo error to test stack traces')
  },
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    message: z.string().describe('Output message'),
  }),
})

const result = await executeContext({
  options: { loop: 1 },
  instructions: `call the "demo" tool`,
  tools: [demo],
  exits: [exit],
  client,
})

const iteration = result.iterations.at(-1)

if (iteration?.status.type === 'execution_error') {
  console.log('Stack trace:')
  console.log(iteration.status.execution_error.message)
  console.log(iteration.status.execution_error.stack)
} else {
  console.log('Last iteration:', iteration?.status)
}
