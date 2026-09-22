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
import chalk from 'chalk'
import { execute } from 'llmz'

// Initialize Botpress client for LLM communication
const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Display context about the problem we're solving
console.log('Calculating the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5...')
console.log('The model will generate JavaScript to calculate the answer.')

// Execute a mathematical computation in worker mode
// Worker mode is perfect for one-shot computational tasks
const result = await execute({
  model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
  // Give the LLM a mathematical problem to solve
  // LLMz will generate JavaScript code to compute the answer
  instructions: 'What is the sum of all integers between 14 and 1078 that are divisible by 3, 9 or 5?',
  client,
  // Note: No chat interface provided - this runs in worker mode
})

// Check if execution was successful and display results
if (result.isSuccess()) {
  console.log(chalk.bold('Generated JavaScript:'))
  console.log(result.iterations.filter((iteration) => iteration.code).at(-1)?.code ?? '// no code generated')
  console.log(chalk.bold('\nResult:'))
  console.log(chalk.cyan(JSON.stringify(result.output, null, 2)))
}
