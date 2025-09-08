/**
 * Example 16: Advanced Tool Chaining
 *
 * This example demonstrates sophisticated tool chaining and data flow in worker mode.
 * It shows how to:
 * - Chain multiple tools with complex data dependencies
 * - Pass data between tools with type-safe schemas
 * - Perform data transformations and filtering between tool calls
 * - Execute complex multi-step workflows in a single turn
 * - Handle nested object structures and array operations
 *
 * Key concepts:
 * - Multi-tool orchestration in single execution
 * - Complex data flow between tools
 * - Type-safe data extraction and transformation
 * - Single-turn complex workflows
 * - Demonstration of LLMz's superiority over traditional tool calling
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

// This example demonstrates the power of LLMz's code generation approach:
// Tool C requires:
// 1. A deep nested number from Tool A
// 2. Filtered array data from Tool B (only numbers > 50)
// All of this complex orchestration happens in a SINGLE LLM turn
// Traditional JSON tool calling would require multiple expensive roundtrips

// Tool A: Generates a random number in a deeply nested structure
// This demonstrates how LLMz handles complex object schemas
const ToolA = new Tool({
  name: 'tool_a',
  output: z.object({
    pick: z.object({
      deep: z.object({
        deep_number: z.number(),
      }),
    }),
  }),
  async handler() {
    const deep_number = Math.floor(Math.random() * 100)
    console.log('Tool A executed, returning number:', deep_number)
    return {
      pick: {
        deep: {
          deep_number,
        },
      },
    }
  },
})

// Tool B: Generates an array of random numbers
// The LLM will need to filter this array for Tool C
const ToolB = new Tool({
  name: 'tool_b',
  output: z.number().array(),
  async handler() {
    const array = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
    console.log('Tool B executed, returning array:', array)
    return array
  },
})

// Tool C: Consumes processed data from both Tool A and Tool B
// This demonstrates complex data dependencies and processing
const ToolC = new Tool({
  name: 'tool_c',
  input: z.object({
    first_task: z.number().describe('Number from tool A'),
    second_task: z.number().array().describe('Numbers from tool B that are greater than 50'),
  }),
  output: z.number().describe("The 'secret' number"),
  async handler({ first_task, second_task }) {
    console.log('Tool C executed with input:', { first_task, second_task })

    // Compute the final "secret" number by combining the inputs
    return first_task + second_task.reduce((acc, num) => acc + num, 0)
  },
})

// Exit condition to capture the final result
const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

// Execute the complex workflow
// The LLM will generate code that:
// 1. Calls Tool A and extracts the deep nested number
// 2. Calls Tool B and filters the array for numbers > 50
// 3. Calls Tool C with the processed data
// 4. Returns the final result through the exit
const result = await execute({
  instructions: `I need the 'secret' number please. Do not think, try to do it in one step.`,
  tools: [ToolA, ToolB, ToolC],
  exits: [exit],
  client,
})

// Display the results showing both the generated code and final output
if (result.is(exit)) {
  console.log(
    box([
      'The LLM wrote the code to solve the problem:',
      ...result.iteration.code!.split('\n'),
      '',
      'It then executed it and returned the result:',
      chalk.cyan.bold(result.output.result.toString()),
    ])
  )
}
