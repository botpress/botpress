import { z } from '@bpinternal/zui'

import { Exit } from '../../src/exit.js'
import { ObjectInstance } from '../../src/objects.js'
import { Tool } from '../../src/tool.js'

// Transport fixtures only. The recording client never fetches or decodes them.
export const media = {
  userImage: 'https://example.invalid/fixtures/user-invoice.png',
  userVoice: 'https://example.invalid/fixtures/user-question.wav',
  image: 'https://example.invalid/fixtures/plan-comparison.png',
  audio: 'https://example.invalid/fixtures/plan-overview.mp3',
  video: 'https://example.invalid/fixtures/getting-started.mp4',
  file: 'https://example.invalid/fixtures/plans.pdf',
}

export const resolved = new Exit({
  name: 'resolved',
  description: 'The requested account task is complete.',
  schema: z.object({ summary: z.string() }),
})

export const handoff = new Exit({
  name: 'handoff',
  description: 'Transfer the conversation to the requested support queue.',
  schema: z.object({ queue: z.enum(['billing', 'support']), reason: z.string() }),
})

export const cancelled = new Exit({
  name: 'cancelled',
  description: 'The user cancelled the current task before further work should begin.',
  schema: z.object({ reason: z.string() }),
})

export function createFixtures() {
  const calls = { readAccount: 0, readInvoice: 0, getMedia: 0 }
  const customer = new ObjectInstance({
    name: 'customer',
    properties: [
      { name: 'id', value: 'customer-42', type: z.string(), writable: false },
      {
        name: 'preferences',
        value: { plan: 'Standard', emailUpdates: true },
        type: z.object({ plan: z.enum(['Standard', 'Team']), emailUpdates: z.boolean() }),
        writable: true,
      },
    ],
  })
  const tools = [
    new Tool({
      name: 'readAccount',
      description: 'Read the customer account, including the name, email, and current plan.',
      input: z.object({ customerId: z.string() }),
      output: z.object({ id: z.string(), name: z.string(), email: z.string(), plan: z.string() }),
      handler: async () => {
        calls.readAccount++

        return { id: 'account-42', name: 'Maya', email: 'maya@example.com', plan: 'Standard' }
      },
    }),
    new Tool({
      name: 'readInvoice',
      description: 'Read the latest invoice for a customer.',
      input: z.object({ customerId: z.string() }),
      output: z.object({ id: z.string(), total: z.number(), currency: z.string(), status: z.string() }),
      handler: async () => {
        calls.readInvoice++

        return { id: 'invoice-42', total: 20, currency: 'USD', status: 'paid' }
      },
    }),
    new Tool({
      name: 'getMedia',
      description: 'Get known URLs for the plan comparison image, spoken overview, guide video, and PDF.',
      output: z.object({ image: z.string(), audio: z.string(), video: z.string(), file: z.string() }),
      handler: async () => {
        calls.getMedia++

        return { image: media.image, audio: media.audio, video: media.video, file: media.file }
      },
    }),
  ]

  return {
    calls,
    tools,
    objects: [customer],
    exits: [resolved, handoff, cancelled],
    instructions:
      'Help customers with their account and plans. Use tools for account facts. Standard is $20/month; Team is $50/month. Keep replies concise.',
  }
}
