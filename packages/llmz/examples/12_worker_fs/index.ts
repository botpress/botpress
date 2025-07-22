/**
 * Example 12: Worker File System Operations
 * 
 * This example demonstrates file system operations in worker mode.
 * It shows how to:
 * - Use objects instead of tools for more complex APIs
 * - Implement file system operations (read, write, create directories)
 * - Handle conditional logic based on file existence
 * - Use worker mode for automated file management tasks
 * - Work with exit conditions and structured outputs
 * 
 * Key concepts:
 * - Object vs Tool patterns (objects provide richer APIs)
 * - File system integration through utilities
 * - Conditional file operations
 * - Worker mode automation
 * - Exit handling with structured data
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit } from 'llmz'
import { makeFileSystem } from '../utils/tools/file-system'
import { printTrace } from '../utils/debug'

// Initialize Botpress client for LLM communication
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Define exit condition with structured output
// This allows the worker to return a final message when complete
const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    message: z.string().describe('Output message'),
  }),
})

// Execute file system operations in worker mode
// This demonstrates automated file management without user interaction
const result = await execute({
  // Provide clear instructions for the file management task
  instructions: `Today's date is ${new Date().toLocaleDateString()}
You need to make sure there's a file for today in the "/notes" folder.
If the file exists, return its content.
If the file does not exists, create the file with today's date as the name and write "Hello, world!" in it.`,
  
  // Use objects instead of tools for richer API access
  // Objects provide more complex interfaces than simple input/output tools
  objects: [makeFileSystem(client)],
  
  // Provide exit condition for task completion
  exits: [exit],
  client,
  
  // Enable trace logging to see file system operations
  onTrace: ({ trace }) => printTrace(trace),
})

// Handle the completion result
if (result.is(exit)) {
  // Display the final message from the worker
  console.log('Message:', result.output.message)
}
