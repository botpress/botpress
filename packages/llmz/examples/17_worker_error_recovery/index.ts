import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Tool } from 'llmz'
import { printTrace } from '../utils/debug'
import { box } from '../utils/box'
import chalk from 'chalk'

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

const result = await execute({
  instructions: `Return the secret code (getCode)`,
  tools: [errorProneTool],
  client,
  onTrace: ({ trace }) => printTrace(trace),
})

if (result.isSuccess()) {
  console.log(
    box([
      'The LLM wrote the code to solve the problem:',
      ...result.iteration.code!.split('\n'),
      '',
      'It then executed it and returned the result:',
      chalk.cyan.bold(JSON.stringify(result.output, null, 2)),
    ])
  )
}
