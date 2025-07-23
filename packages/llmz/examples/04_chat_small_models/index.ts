/**
 * Example 04: Small Models with Tools
 *
 * This example demonstrates how LLMz works effectively with smaller, faster models.
 * It shows how to:
 * - Use smaller models for cost-effective operations
 * - Implement a complete support ticket management system
 * - Design tools with clear schemas and descriptions
 * - Handle CRUD operations through tools
 * - Enable trace logging for debugging tool calls
 *
 * Key concepts:
 * - Model selection with options.model
 * - Tool-based state management
 * - Structured data manipulation with Zod schemas
 * - Error handling in tool implementations
 * - Lightweight trace logging
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Tool } from 'llmz'

import { CLIChat } from '../utils/cli-chat'
import { lightToolTrace } from '../utils/debug'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Sample ticket data for demonstration
// In a real application, this would be stored in a database
let TICKETS = [
  { id: '123', status: 'Open', description: 'Salesforce keeps loading forever' },
  { id: '456', status: 'Closed', description: 'Unable to connect to the database' },
  { id: '789', status: 'Open', description: 'Error in the payment gateway integration' },
]

// Tool for retrieving individual ticket details
// Demonstrates read operations with error handling
const getTicket = new Tool({
  name: 'getTicket',
  description: 'Get a support ticket',
  input: z.object({
    ticketId: z.string().describe('The ID of the support ticket'),
  }),
  output: z.string().describe('Details of the support ticket'),
  async handler({ ticketId }) {
    // Search for the ticket in our data store
    const ticket = TICKETS.find((t) => t.id === ticketId)

    // Handle not found case with descriptive error
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found.`)
    }

    // Return formatted ticket information
    return `Ticket ID: ${ticket.id}, Status: ${ticket.status}, Description: ${ticket.description}`
  },
})

// Tool for closing/updating ticket status
// Demonstrates update operations with validation
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
    // Validate ticket exists before attempting to update
    if (!TICKETS.some((t) => t.id === ticketId)) {
      throw new Error(`Ticket with ID ${ticketId} not found.`)
    }

    // Update the ticket status using immutable pattern
    TICKETS = TICKETS.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: 'Closed' } : ticket))

    // Return structured confirmation response
    return {
      message: `Ticket ID: ${ticketId} has been closed successfully.`,
    }
  },
})

// Tool for listing all available tickets
// Demonstrates list operations with data transformation
const listTickets = new Tool({
  name: 'listTickets',
  description: 'List all support tickets',
  input: z.object({}), // No input parameters required
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
    // Transform internal data structure for external consumption
    // Only expose necessary fields for security/simplicity
    return {
      tickets: TICKETS.map((ticket) => ({
        id: ticket.id,
        description: ticket.description,
      })),
    }
  },
})

const chat = new CLIChat()

// Main execution loop with smaller model configuration
while (await chat.iterate()) {
  await execute({
    instructions:
      'You are a helpful assistant. You can manage support tickets by listing, retrieving, or closing them.',

    // Provide all ticket management tools to the agent
    tools: [getTicket, closeTicket, listTickets],
    client,
    chat,

    // Enable lightweight trace logging to see tool calls
    onTrace: ({ trace }) => lightToolTrace(trace),

    // Configure execution options
    options: {
      // Use a smaller, faster model for cost-effective operations
      // Smaller models work well with LLMz because TypeScript generation
      // is easier than complex JSON tool calling
      model: 'openai:gpt-4.1-mini-2025-04-14',
    },
  })
}
