/**
 * Example 02: Chat with Exits
 *
 * This example demonstrates how to use custom exits in chat mode.
 * It shows how to:
 * - Define custom exit conditions with and without output schemas
 * - Handle different exit types in the execution result
 * - Use type-safe exit checking with result.is()
 * - Implement escalation workflows with structured data
 *
 * Key concepts:
 * - Exit definitions with typed schemas
 * - Multiple exit conditions handling
 * - Automatic ListenExit for user interaction
 * - Type-safe result checking
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit, ListenExit } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

// Initialize Botpress client for LLM communication
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Chat executions can terminate in multiple ways:
// 1. ListenExit: Agent pauses to wait for user input (automatic in chat mode)
// 2. Custom exits: User-defined conditions that end execution with specific outcomes
// This example shows two custom exits for different termination scenarios

const chat = new CLIChat()

// Define a simple exit without output data
// When this exit is triggered, the execution ends with no additional information
const exit = new Exit({
  name: 'exit',
  description: 'When the user wants to exit the program',
})

// Define an exit with structured output schema
// The LLM will generate data matching this schema when the exit is triggered
// This enables type-safe data extraction from exit conditions
const escalation = new Exit({
  name: 'escalation',
  description: 'Escalate the issue to a human agent',
  schema: z.object({
    reason: z.enum(['Frustrated user', 'Technical issue', 'Sensitive topic', 'Other']),
  }),
})

// Main conversation loop with exit handling
while (await chat.iterate()) {
  // Execute with custom exits defined
  const result = await execute({
    instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',

    // Custom exits available to the agent
    // Note: ListenExit is automatically added when using chat mode
    exits: [exit, escalation],
    chat,
    client,
  })

  // Type-safe exit checking using result.is()
  // This provides compile-time safety and runtime type narrowing

  if (result.is(exit)) {
    // Handle simple exit - no additional data
    console.log(`-----------------------`)
    console.log('👋 Goodbye!')
    console.log(`-----------------------`)
    process.exit(0)
  }

  if (result.is(escalation)) {
    // Handle escalation exit - access typed output data
    console.log(`-----------------------`)
    console.log(`🚨 Escalation needed: ${result.output.reason}`)
    console.log(`-----------------------`)
    process.exit(0)
  }

  if (result.is(ListenExit)) {
    // The agent has paused execution to wait for user input
    // Continue the loop to process the next user message
    // This is the normal flow for continuing conversations
  }
}
