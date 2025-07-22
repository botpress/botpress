/**
 * Example 15: Stack Trace Handling and Error Reporting
 * 
 * This example demonstrates LLMz's error handling and stack trace reporting capabilities.
 * It shows how to:
 * - Handle tool execution errors gracefully
 * - Access detailed stack trace information for debugging
 * - Implement error reporting and diagnostics
 * - Use execution status checking for error handling
 * - Display formatted error information to users
 * 
 * Key concepts:
 * - Error result status checking with isError()
 * - Execution error details and stack traces
 * - Tool error propagation and handling
 * - Debugging information access
 * - Error display and formatting patterns
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit, Tool } from 'llmz'
import { box } from '../utils/box'
import chalk from 'chalk'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Demo tool that intentionally throws an error
// This demonstrates how errors in tools are handled and reported
const demo = new Tool({
  name: 'demo',
  async handler() {
    // Throw an error to demonstrate stack trace handling
    // In production, this could be any kind of tool failure
    throw new Error('This is a demo error to test stack traces')
  },
})

// Exit condition (won't be reached due to the error)
const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    message: z.string().describe('Output message'),
  }),
})

// Execute with a tool that will fail
const result = await execute({
  options: { loop: 1 },  // Limit to 1 iteration to avoid retry loops
  instructions: `call the "demo" tool`,
  tools: [demo],
  exits: [exit],
  client,
})

// Verify that we got an error as expected
if (!result.isError()) {
  console.error('Expected an error due to the demo tool, but got:', result.status)
  process.exit(1)
}

// Access and display detailed error information
// LLMz provides comprehensive error details including stack traces
if (result.iteration?.status.type === 'execution_error') {
  console.log(
    box([
      chalk.red('An error occurred during the execution:'),
      // Display the error message
      result.iteration.status.execution_error.message,
      // Display the complete stack trace for debugging
      // LLMz preserves stack traces while sanitizing internal framework details
      ...result.iteration.status.execution_error.stack.split('\n'),
    ])
  )
}
