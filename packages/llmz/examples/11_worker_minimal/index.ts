import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit } from 'llmz'
import { printTrace } from '../utils/debug'
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

console.log('Calculating the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5...')
console.log('This is usually a hard problem for LLMs without code execution.')
console.log('With LLMz, it naturally writes the code to solve it in a few milliseconds.')

const result = await executeContext({
  instructions: `What is the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5?`,
  exits: [exit],
  client,
})

const iteration = result.iterations.at(-1)

if (iteration?.hasExitedWith(exit)) {
  console.log(
    box(
      [
        'The LLM wrote the code to solve the problem:',
        ...iteration.code!.split('\n'),
        '',
        'It then executed it and returned the result:',
        chalk.cyan.bold(String(iteration.status.exit_success.return_value.result)),
      ],
      80
    )
  )
}
