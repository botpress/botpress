import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit } from 'llmz'
import { makeFileSystem } from '../utils/tools/file-system'
import { printTrace } from '../utils/debug'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    message: z.string().describe('Output message'),
  }),
})

const result = await executeContext({
  instructions: `Today's date is ${new Date().toLocaleDateString()}
You need to make sure there's a file for today in the "/notes" folder.
If the file exists, return its content.
If the file does not exists, create the file with today's date as the name and write "Hello, world!" in it.`,
  objects: [makeFileSystem(client)],
  exits: [exit],
  client,
  onTrace: ({ trace }) => printTrace(trace),
})

const iteration = result.iterations.at(-1)

if (iteration?.hasExitedWith(exit)) {
  console.log('Message:', iteration.status.exit_success.return_value.message)
}
