import { Client } from '@botpress/client'
import { execute } from 'llmz'
import { box } from '../utils/box'
import chalk from 'chalk'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

console.log('Calculating the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5...')
console.log('This is usually a hard problem for LLMs without code execution.')
console.log('With LLMz, it naturally writes the code to solve it in a few milliseconds.')

const result = await execute({
  instructions: `What is the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5?`,
  client,
})

if (result.isSuccess()) {
  console.log(
    box(
      [
        'The LLM wrote the code to solve the problem:',
        ...result.iteration.code!.split('\n'),
        '',
        'It then executed it and returned the result:',
        chalk.cyan.bold(JSON.stringify(result.output, null, 2)),
      ],
      80
    )
  )
}
