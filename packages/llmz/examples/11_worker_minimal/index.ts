import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit } from 'llmz'
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

const result = await execute({
  instructions: `What is the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5?`,
  exits: [exit],
  client,
})

if (result.status === 'success' && exit.match(result.result)) {
  const iteration = result.iterations.at(-1)!
  console.log(
    box(
      [
        'The LLM wrote the code to solve the problem:',
        ...iteration.code!.split('\n'),
        '',
        'It then executed it and returned the result:',
        chalk.cyan.bold(String(result.result.result.result)),
      ],
      80
    )
  )
}
