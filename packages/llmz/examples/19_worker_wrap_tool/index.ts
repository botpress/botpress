/**
 * Example 19: Tool Wrapping and Enhancement
 * 
 * This example demonstrates advanced tool composition patterns using tool wrapping.
 * It shows how to:
 * - Create enhanced versions of existing tools using clone()
 * - Extend tool output schemas with additional fields
 * - Implement decorator patterns for tool functionality
 * - Chain tool execution with pre/post processing
 * - Build composable tool architectures
 * 
 * Key concepts:
 * - Tool cloning and enhancement
 * - Schema extension and composition
 * - Decorator pattern implementation
 * - Tool execution chaining
 * - Composable tool design patterns
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

// Exit condition to capture the final result
const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

// Original base tool with simple greeting functionality
// This demonstrates the tool that will be enhanced through wrapping
const normalTool = new Tool({
  name: 'greet',
  description: 'A tool that greets the user',
  input: z.object({
    greeting: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
  async handler(input) {
    console.log(chalk.green('✓') + ` Original tool executed with input: ${input.greeting}`)
    return { message: `Hello, ${input.greeting}!` }
  },
})

// Enhanced tool created by wrapping the original tool
// This demonstrates the decorator pattern for tool enhancement
const wrappedTool = normalTool.clone({
  // Extend the output schema to include additional fields
  // This shows how to compose and extend existing schemas
  output: (schema) =>
    schema!.extend({
      added: z.number().describe('Tool confirmation number'),
    }),
  
  // Enhanced handler that calls the original tool and adds functionality
  async handler(input, ctx) {
    console.log(chalk.blue('✓') + ` Wrapped tool executed with input: ${input.greeting}`)
    
    // Execute the original tool to get its result
    // This demonstrates composition and delegation patterns
    const result = await normalTool.execute(input, ctx)
    
    // Return enhanced result with additional data
    // This shows how to augment tool outputs with new information
    return {
      message: `Wrapped tool executed with input: ${input.greeting}. Original message: ${result.message}`,
      added: 666,  // Additional confirmation code
    }
  },
})

// Execute using the wrapped tool
const result = await execute({
  instructions: `Greet the user and return the confirmation code`,
  exits: [exit],
  
  // Use the wrapped tool instead of the original
  // The LLM will see the enhanced schema and functionality
  tools: [wrappedTool],
  client,
})

// Display the results showing the enhanced functionality
if (result.is(exit)) {
  console.log(
    box(
      [
        'The LLM wrote this code:',
        // Show the generated code that used the wrapped tool
        ...result.iteration.code!.split('\n'),
        '',
        'It then executed it and returned the result:',
        // Display the confirmation code from the wrapped tool
        chalk.cyan.bold(result.output.result.toString()),
      ],
      80
    )
  )
}
