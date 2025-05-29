import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit } from 'llmz'

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

const result = await executeContext({
  instructions: `What is the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5?`,
  exits: [exit],
  client,
})

const iteration = result.iterations.at(-1)

if (iteration?.hasExitedWith(exit)) {
  console.log('Result:', iteration.status.exit_success.return_value.result)
}
