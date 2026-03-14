import { Client } from '@botpress/client'
import * as z from '@bpinternal/zui'
import * as llmz from 'llmz'

const resultExit = new llmz.Exit({
  name: 'result',
  description: 'Exit with the final result',
  schema: z.number().describe('The final result as a number'),
})

const main = async () => {
  const client = new Client({
    workspaceId: '$workspaceId',
    token: '$token',
    botId: '$botId',
  })

  const output = await llmz.execute({
    client,
    instructions: 'What is 2 times 2 ?',
    exits: [resultExit],
  })

  if (!output.is(resultExit)) {
    console.error('Unexpected exit', output.toJSON())
    throw new Error('Unexpected exit')
  }

  console.info(output.output)
}

void main()
