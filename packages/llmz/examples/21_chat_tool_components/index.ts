/**
 * Example 21: Yielding Components from Tool Handlers
 *
 * This example demonstrates how tool handlers can directly yield UI components
 * back to the chat interface using async generator functions. Unlike example 10
 * where the LLM yielids components, here the tool handler itself controls what
 * to display and when.
 *
 * Key concepts:
 * - Tool handlers as async generators (async function*)
 * - Yielding components mid-execution for progress updates
 * - Component.render() for constructing RenderedComponent objects
 * - Tool-side component rendering vs LLM-side component yielding
 *
 * Contrast with example 10: the LLM no longer needs to know about components —
 * the tool handler takes care of rendering directly.
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'

import chalk from 'chalk'
import { Component, execute, Tool } from 'llmz'
import { box } from '../utils/box'
import { CLIChat } from '../utils/cli-chat'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Define a custom UI component for displaying plane tickets
const PlaneTicketComponent = new Component({
  name: 'PlaneTicket',
  description: 'A component to display a plane ticket',
  type: 'leaf',
  leaf: {
    props: z.object({
      ticketNumber: z.string().describe('The unique ticket number for the plane ticket'),
      from: z.string().describe('The departure city'),
      to: z.string().describe('The destination city'),
      date: z.string().describe('The date of the flight (in YYYY-MM-DD format)'),
      price: z.number().optional().describe('The price of the ticket'),
    }),
  },
  examples: [
    {
      name: 'PlaneTicket',
      description: 'A simple plane ticket example',
      code: '<PlaneTicket from="New York" to="Los Angeles" date="2023-10-01" price={299.99} ticketNumber="ABC-0000000" />',
    },
  ],
})

// Define a progress component for status updates
const ProgressComponent = new Component({
  name: 'Progress',
  description: 'Displays a progress update message',
  type: 'leaf',
  leaf: {
    props: z.object({
      message: z.string().describe('The progress message'),
      step: z.number().describe('Current step number'),
      total: z.number().describe('Total number of steps'),
    }),
  },
  examples: [
    {
      name: 'Basic Progress',
      description: 'Show a progress bar with step and total',
      code: '<Progress message="Checking availability..." step={1} total={3} />',
    },
    {
      name: 'Mid-progress',
      description: 'Midway progress update',
      code: '<Progress message="Calculating price..." step={2} total={3} />',
    },
  ],
})

// Tool for purchasing tickets — uses async generator to yield components
const purchaseTicket = new Tool({
  name: 'purchase_ticket',
  description: 'Purchase a plane ticket, showing progress updates along the way',
  input: z.object({
    from: z.string().describe('The departure city'),
    to: z.string().describe('The destination city'),
    date: z.string().describe('The date of the flight (in YYYY-MM-DD format)'),
  }),
  output: z.object({
    price: z.number().describe('The price of the purchased ticket in USD'),
    ticketNumber: z.string().describe('The unique ticket number for the purchased ticket'),
    confirmation: z.string().describe('Confirmation message for the ticket purchase'),
  }),
  // Async generator handler: yields components progress, returns final result
  async *handler({ from, date, to }) {
    // Step 1: Show progress
    yield ProgressComponent.render({ message: 'Checking flight availability...', step: 1, total: 3 })
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Step 2: Show more progress
    yield ProgressComponent.render({ message: 'Calculating best price...', step: 2, total: 3 })
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Step 3: Yiels the ticket component itself
    yield PlaneTicketComponent.render({
      from,
      to,
      date,
      price: 299.99,
      ticketNumber: 'TICKET-345633',
    })

    // Final return — the tool result for the LLM
    return {
      price: 299.99,
      ticketNumber: 'TICKET-345633',
      confirmation: `Ticket from ${from} to ${to} on ${date} purchased successfully!`,
    }
  },
})

const chat = new CLIChat()

chat.transcript.push({
  role: 'user',
  content: 'I want to purchase a plane ticket from New York to Los Angeles on 2025-10-01.',
})

// Register component renderers — same as example 10
chat.registerComponent(PlaneTicketComponent, async (message) => {
  const { ticketNumber, from, to, date, price } = message.props

  const ticket = box([
    chalk.white.bold('             ✈️  FLIGHT TICKET'),
    `${chalk.yellow.bold('Ticket Number:')} ${chalk.white(ticketNumber)}`,
    '',
    `${chalk.green.bold('From:')} ${chalk.white(from)}`,
    `${chalk.red.bold('To:')} ${chalk.white(to)}`,
    '',
    `${chalk.magenta.bold('Date:')} ${chalk.white(date)}`,
    `${chalk.cyan.bold('Price:')} ${chalk.white(`$${price?.toFixed(2) || 'N/A'}`)}`,
    '',
    chalk.gray('         Have a safe flight! 🛫'),
  ])

  console.log(ticket)
})

chat.registerComponent(ProgressComponent, async (message) => {
  const { step, total, message: msg } = message.props
  const bar = '█'.repeat(step) + '░'.repeat(Math.max(0, total - step))
  console.log(chalk.blue(`[${bar}]`) + ' ' + chalk.white(msg))
})

// Execute the travel agent workflow
// Note: the LLM no longer needs to know about PlaneTicketComponent —
// the tool handler handles rendering directly
const result = await execute({
  instructions:
    'You are a travel agent. Help the user purchase a plane ticket. The ticket will be displayed automatically when the purchase completes.',
  tools: [purchaseTicket],
  chat,
  client,
})

console.log("Here's the code generated by the LLMz:")
console.log(result.iteration?.code)
