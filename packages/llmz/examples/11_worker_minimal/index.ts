/**
 * Example 11: Minimal Worker Mode
 * 
 * This example demonstrates the simplest usage of LLMz in worker mode.
 * It shows how to:
 * - Execute mathematical computations through code generation
 * - Use LLMz without chat interface for one-shot tasks
 * - Access generated code and execution results
 * - Handle success/failure states with proper result checking
 * - Demonstrate the power of code generation over traditional tool calling
 * 
 * Key concepts:
 * - Worker mode execution (no chat interface)
 * - Mathematical problem solving through code generation
 * - Result inspection with isSuccess()
 * - Code generation capabilities demonstration
 * - One-shot task execution pattern
 */

import { Client } from '@botpress/client'
import { execute } from 'llmz'
import { box } from '../utils/box'
import chalk from 'chalk'

// Initialize Botpress client for LLM communication
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Display context about the problem we're solving
console.log('Calculating the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5...')
console.log('This is usually a hard problem for LLMs without code execution.')
console.log('With LLMz, it naturally writes the code to solve it in a few milliseconds.')

// Execute a mathematical computation in worker mode
// Worker mode is perfect for one-shot computational tasks
const result = await execute({
  // Give the LLM a mathematical problem to solve
  // LLMz will generate TypeScript code to compute the answer
  instructions: `What is the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5?`,
  client,
  // Note: No chat interface provided - this runs in worker mode
})

// Check if execution was successful and display results
if (result.isSuccess()) {
  // Display both the generated code and the computed result
  console.log(
    box(
      [
        'The LLM wrote the code to solve the problem:',
        // Show the actual TypeScript code that was generated
        ...result.iteration.code!.split('\n'),
        '',
        'It then executed it and returned the result:',
        // Display the final computed answer
        chalk.cyan.bold(JSON.stringify(result.output, null, 2)),
      ],
      80  // Box width for nice formatting
    )
  )
}
