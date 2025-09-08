/**
 * Example 17: Error Recovery and Retry Logic
 *
 * This example demonstrates LLMz's intelligent error recovery capabilities.
 * It shows how to:
 * - Handle tool errors with automatic retry and correction
 * - Implement intelligent error recovery based on error messages
 * - Use LLMz's built-in retry logic for failed operations
 * - Demonstrate self-correcting code generation
 * - Show how LLMs can learn from errors and adapt their approach
 *
 * Key concepts:
 * - Automatic error recovery and retry mechanisms
 * - Error message analysis and correction
 * - Self-adapting code generation
 * - Tool input validation and error handling
 * - Intelligent failure recovery patterns
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Tool } from 'llmz'
import { printTrace } from '../utils/debug'
import { box } from '../utils/box'
import chalk from 'chalk'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Tool that expects specific input and fails otherwise
// This demonstrates how LLMz can recover from validation errors
const errorProneTool = new Tool({
  name: 'getCode',
  description: 'A tool that may throw an error',
  input: z.object({
    input: z.string().optional(),
  }),
  output: z.object({
    code: z.number(),
  }),
  async handler({ input }) {
    // This tool only works with a specific input value
    // The LLM must discover this through trial and error recovery
    if (input !== 'hello, world') {
      throw new Error('Invalid input, expected "hello, world"')
    }

    // Return the secret code when input is correct
    return { code: 6600 }
  },
})

// Execute with automatic error recovery
// LLMz will automatically retry when the tool fails and learn from the error
const result = await execute({
  instructions: `Return the secret code (getCode)`,
  tools: [errorProneTool],
  client,

  // Enable trace logging to see the error recovery process
  onTrace: ({ trace }) => printTrace(trace),

  // Note: No explicit retry configuration needed
  // LLMz has built-in intelligent retry logic that:
  // 1. Analyzes the error message
  // 2. Adapts the generated code based on the error
  // 3. Retries with corrected input
})

// Display successful result after error recovery
if (result.isSuccess()) {
  console.log(
    box([
      'The LLM wrote the code to solve the problem:',
      // Show the final working code (after any error recovery)
      ...result.iteration.code!.split('\n'),
      '',
      'It then executed it and returned the result:',
      // Display the successfully extracted secret code
      chalk.cyan.bold(JSON.stringify(result.output, null, 2)),
    ])
  )
}
