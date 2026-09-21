import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { Exit, Session, execute } from 'llmz'

const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const saved = new Exit({
  name: 'saved',
  description: 'Confirm the stored reference.',
  schema: z.object({ reference: z.string() }),
})
const session = new Session({ variables: { reference: 'order-42' } })
session.append({ role: 'user', content: 'Remember that this order is already paid. Return its reference.' })
const first = await execute({
  model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
  client,
  session,
  exits: [saved],
})
if (!first.is(saved)) throw new Error(`Could not save the order: ${first.status}`)

// Store this JSON in your database. It contains data, not tool implementations or credentials.
const snapshot = JSON.stringify(session)
const restored = Session.fromJSON(JSON.parse(snapshot))
restored.append({ role: 'event', name: 'shipping.requested', payload: { orderId: 'order-42' } })
const reviewed = new Exit({
  name: 'reviewed',
  description: 'Report the resumed order state.',
  schema: z.object({ reference: z.string(), paid: z.boolean() }),
})
const second = await execute({
  model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
  client,
  session: restored,
  exits: [reviewed],
  instructions:
    'React to the queued shipping event. Report the retained order reference and payment state. Do not charge again.',
})
if (!second.is(reviewed)) throw new Error(`Could not resume the order: ${second.status}`)
console.log('Resumed:', second.output)
