import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit, Tool } from 'llmz'
import { box } from '../utils/box'
import chalk from 'chalk'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

const normalTool = new Tool({
  name: 'greet',
  description: 'A tool that greets the user',
  input: z.object({
    greeting: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
  async handler(input) {
    console.log(chalk.green('✓') + ` Original tool executed with input: ${input.greeting}`)
    return { message: `Hello, ${input.greeting}!` }
  },
})

const wrappedTool = normalTool.clone({
  output: (schema) =>
    schema!.extend({
      added: z.number().describe('Tool confirmation number'),
    }),
  async handler(input, ctx) {
    console.log(chalk.blue('✓') + ` Wrapped tool executed with input: ${input.greeting}`)
    const result = await normalTool.execute(input, ctx)
    return {
      message: `Wrapped tool executed with input: ${input.greeting}. Original message: ${result.message}`,
      added: 666,
    }
  },
})

const result = await execute({
  instructions: `Greet the user and return the confirmation code`,
  exits: [exit],
  tools: [wrappedTool],
  client,
})

if (result.is(exit)) {
  console.log(
    box(
      [
        'The LLM wrote this code:',
        ...result.iteration.code!.split('\n'),
        '',
        'It then executed it and returned the result:',
        chalk.cyan.bold(result.output.result),
      ],
      80
    )
  )
}
