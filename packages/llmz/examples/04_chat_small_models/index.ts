import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit, Tool } from 'llmz'

import { CLIChat } from '../utils/cli-chat'
import { lightToolTrace } from '../utils/debug'

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

let TICKETS = [
  { id: '123', status: 'Open', description: 'Salesforce keeps loading forever' },
  { id: '456', status: 'Closed', description: 'Unable to connect to the database' },
  { id: '789', status: 'Open', description: 'Error in the payment gateway integration' },
]

const getTicket = new Tool({
  name: 'getTicket',
  description: 'Get a support ticket',
  input: z.object({
    ticketId: z.string().describe('The ID of the support ticket'),
  }),
  output: z.string().describe('Details of the support ticket'),
  async handler({ ticketId }) {
    // Simulate fetching a support ticket
    const ticket = TICKETS.find((t) => t.id === ticketId)
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found.`)
    }
    return `Ticket ID: ${ticket.id}, Status: ${ticket.status}, Description: ${ticket.description}`
  },
})

const closeTicket = new Tool({
  name: 'closeTicket',
  description: 'Close a support ticket',
  input: z.object({
    ticketId: z.string().describe('The ID of the support ticket to close'),
  }),
  output: z.object({
    message: z.string().describe('Confirmation message'),
  }),
  async handler({ ticketId }) {
    if (!TICKETS.some((t) => t.id === ticketId)) {
      throw new Error(`Ticket with ID ${ticketId} not found.`)
    }

    TICKETS = TICKETS.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: 'Closed' } : ticket))

    // Simulate closing a support ticket
    return {
      message: `Ticket ID: ${ticketId} has been closed successfully.`,
    }
  },
})

const listTickets = new Tool({
  name: 'listTickets',
  description: 'List all support tickets',
  input: z.object({}),
  output: z.object({
    tickets: z
      .array(
        z.object({
          id: z.string().describe('Ticket ID'),
          description: z.string().describe('Ticket description'),
        })
      )
      .describe('List of support tickets'),
  }),
  async handler() {
    // Simulate listing support tickets
    return {
      tickets: TICKETS.map((ticket) => ({
        id: ticket.id,
        description: ticket.description,
      })),
    }
  },
})

const chat = new CLIChat({
  client,
  instructions: 'You are a helpful assistant. You can manage support tickets by listing, retrieving, or closing them.',
  exits: [exit],
  tools: [getTicket, closeTicket, listTickets],
  onTrace: ({ trace }) => lightToolTrace(trace),
  options: {
    // Use a tiny model for this example
    model: 'openai:gpt-4.1-mini-2025-04-14',
  },
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
