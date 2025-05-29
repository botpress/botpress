import { Client } from '@botpress/client'
import { Exit, ObjectInstance, executeContext } from 'llmz'
import { z } from '@bpinternal/zui'

import { CLIChat } from '../utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const completed = new Exit({
  name: 'profile_completed',
  description: 'Profile completed',
  schema: z.object({}),
})

const abort = new Exit({
  name: 'abort',
  description: 'Abort the process',
  schema: z.object({
    message: z.string().describe('Abort message'),
  }),
})

const memory: Record<string, any> = {}

const getObjects = () =>
  [
    new ObjectInstance({
      name: 'user',
      description: 'The user profile to keep up to date',
      properties: [
        {
          name: 'name',
          description: 'The name of the user',
          type: z.string().describe('The name of the user').nullable(),
          value: memory['name'] ?? null,
          writable: true,
        },
        {
          name: 'age',
          description: 'The age of the user',
          type: z
            .number()
            .describe('The age of the user')
            .min(18, 'Sorry you must be at least 18 years old')
            .max(40, 'Sorry you cannot be above 40 years old')
            .nullable(),
          value: memory['age'] ?? null,
          writable: true,
        },
        {
          name: 'email',
          description: "The user's email address",
          type: z.string().email().describe("The user's email address").nullable(),
          value: memory['email'] ?? null,
          writable: true,
        },
      ],
    }),
  ] satisfies ObjectInstance[]

const chat = new CLIChat({
  client,
  instructions: `You need to fill in the user profile with the user's information.
Fill the individual fields with the information you have at hand before asking the user for more information.`,
  exits: [completed, abort],
  objects: getObjects,
  onIterationEnd: async (iteration) => {
    for (let mutation of iteration.mutations) {
      if (mutation.object === 'user') {
        console.log('🧩 Mutation:', mutation)
        memory[mutation.property] = mutation.after
      }
    }
  },
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
