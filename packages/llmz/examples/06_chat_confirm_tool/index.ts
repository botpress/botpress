/**
 * Example 06: Tool Confirmation Pattern
 *
 * This example demonstrates how to implement user confirmation for destructive operations.
 * It shows how to:
 * - Use ThinkSignal to pause execution and request user confirmation
 * - Implement stateful confirmation workflows
 * - Handle confirmation state management across execution cycles
 * - Use onExit callbacks to manage execution flow
 * - Protect against accidental destructive operations
 *
 * Key concepts:
 * - ThinkSignal for interrupting execution flow
 * - Stateful confirmation management
 * - Exit callback handling with onExit
 * - Safety patterns for destructive operations
 * - User consent workflows
 */

import { Client } from '@botpress/client'
import { execute, ListenExit, ThinkSignal, Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import { CLIChat } from '../utils/cli-chat'
import { printTrace } from '../utils/debug'
import chalk from 'chalk'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// State management for confirmation workflow
// These flags coordinate the confirmation process across execution cycles
let should_confirm = false // Set when tool needs confirmation
let confirming = false // Set when user is being asked to confirm

// Tool that requires user confirmation before executing
// Demonstrates the confirmation pattern for destructive operations
const overwriteData = new Tool({
  name: 'overwrite',
  output: z.object({
    success: z.boolean().describe('Whether the operation was successful'),
  }),
  async handler() {
    // First call: Request confirmation if not already confirming
    if (!confirming) {
      should_confirm = true

      // ThinkSignal interrupts execution and sends a message to the agent
      // This causes the agent to pause and ask the user for confirmation
      throw new ThinkSignal('Please ask the user for confirmation before proceeding.')
    } else {
      // Second call: User has confirmed, proceed with operation
      should_confirm = false
      confirming = false
    }

    // Execute the actual destructive operation
    console.log(chalk.bold('✅ Overwriting data'))

    return { success: true }
  },
})

const chat = new CLIChat()

// Main execution loop with confirmation handling
while (await chat.iterate()) {
  await execute({
    client,
    chat,
    instructions: `You are an assistant that can overwrite data. 
  Greet the user and tell them you can overwrite data (show a button "Overwrite Data").
  Use buttons for quick responses when possible.`,
    tools: [overwriteData],
    onTrace: ({ trace }) => printTrace(trace, ['tool_call']),

    // onExit callback manages confirmation state transitions
    // This ensures proper coordination between tool calls and user responses
    onExit: (exit) => {
      // Handle state management when execution pauses for user input
      if (ListenExit.match(exit)) {
        if (should_confirm) {
          // Tool has requested confirmation - set up confirmation state
          confirming = true
          should_confirm = false
        } else {
          // Normal execution flow - reset confirmation state
          confirming = false
        }
      }
    },
  })
}
