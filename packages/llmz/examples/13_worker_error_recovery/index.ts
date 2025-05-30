import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit, Tool } from 'llmz'
import { printTrace } from '../utils/debug'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const errorProneTool = new Tool({
  name: 'getCode',
  description: 'A tool that may throw an error',
  input: z.object({
    input: z.string().optional(),
  }),
  output: z.object({
    code: z.number(),
  }),
  async handler({ input }) {
    if (input !== 'hello, world') {
      throw new Error('Invalid input, expected "hello, world"')
    }
    return { code: 6600 }
  },
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

const result = await executeContext({
  instructions: `Return the secret code (getCode)`,
  exits: [exit],
  tools: [errorProneTool],
  client,
  onTrace: ({ trace }) => printTrace(trace),
})

const iteration = result.iterations.at(-1)

if (iteration?.hasExitedWith(exit)) {
  console.log('Result:', iteration.status.exit_success.return_value.result)
}
