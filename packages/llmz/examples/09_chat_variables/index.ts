/**
 * Example 09: Variable Management and State
 * 
 * This example demonstrates advanced state management using ObjectInstance.
 * It shows how to:
 * - Create stateful variables that persist across executions
 * - Implement property validation with Zod schemas
 * - Use ObjectInstance for structured data management
 * - Handle property writes and validation errors
 * - Track state changes with trace callbacks
 * 
 * Key concepts:
 * - ObjectInstance for stateful variable management
 * - Property validation with constraints (min/max, email format)
 * - Memory persistence across execution cycles
 * - Property trace monitoring
 * - Exit conditions with data collection workflows
 */

import { Client } from '@botpress/client'
import { Exit, ObjectInstance, execute } from 'llmz'
import { z } from '@bpinternal/zui'

import { CLIChat } from '../utils/cli-chat'
import chalk from 'chalk'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Define exit conditions for the profile completion workflow
const completed = new Exit({
  name: 'profile_completed',
  description: 'Profile completed',
  schema: z.object({}),
})

const abort = new Exit({
  name: 'abort',
  description: 'Abort the process',
  schema: z.object({
    message: z.string().describe('Abort message'),
  }),
})

// In-memory storage for user profile data
// This persists across execution cycles
const memory: Record<string, any> = {}

// Function to generate ObjectInstance with current state
// This creates a live, writable object that the LLM can interact with
const getObjects = () =>
  [
    new ObjectInstance({
      name: 'user',
      description: 'The user profile to keep up to date',
      properties: [
        {
          name: 'name',
          description: 'The name of the user',
          type: z.string().describe('The name of the user').nullable(),
          value: memory['name'] ?? null,  // Current value from memory
          writable: true,                 // Allow LLM to modify this property
        },
        {
          name: 'age',
          description: 'The age of the user',
          type: z
            .number()
            .describe('The age of the user')
            .min(18, 'Sorry you must be at least 18 years old')      // Validation constraint
            .max(40, 'Sorry you cannot be above 40 years old')      // Validation constraint
            .nullable(),
          value: memory['age'] ?? null,
          writable: true,
        },
        {
          name: 'email',
          description: "The user's email address",
          type: z.string().email().describe("The user's email address").nullable(),  // Email format validation
          value: memory['email'] ?? null,
          writable: true,
        },
      ],
    }),
  ] satisfies ObjectInstance[]

const chat = new CLIChat()

// Main execution loop with state management
while (await chat.iterate()) {
  await execute({
    client,
    chat,
    instructions: `You need to fill in the user profile with the user's information.
  Fill the individual fields with the information you have at hand before asking the user for more information.`,
    exits: [completed, abort],
    
    // Provide dynamic objects that reflect current state
    objects: getObjects,
    
    // Monitor property changes and errors
    onTrace: ({ trace }) => {
      if (trace.type === 'property') {
        // Property was successfully updated
        console.log(`🧩 ${trace.object}.${trace.property} = ${trace.value}`)
        
        // Persist the change to memory
        memory[trace.property] = trace.value
      } else if (trace.type === 'code_execution_exception') {
        // Handle execution errors (e.g., validation failures)
        console.error(chalk.redBright(`❌ Error executing code:\n${chalk.white.dim(trace.stackTrace)}`))
      }
    },
  })
}

// Display final collected profile data
console.log('Profile completed:', memory)
console.log('👋 Goodbye!')
