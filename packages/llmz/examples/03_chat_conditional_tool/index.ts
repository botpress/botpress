/**
 * Example 03: Conditional Tool Access
 *
 * This example demonstrates dynamic tool access based on user authentication state.
 * It shows how to:
 * - Implement authentication with tools
 * - Dynamically provide different tools based on user identity
 * - Use function-based instructions and tools that evaluate at runtime
 * - Handle role-based access control (RBAC) patterns
 * - Manage stateful user sessions
 *
 * Key concepts:
 * - Dynamic tool filtering based on user state
 * - Authentication workflows with tools
 * - Runtime evaluation of instructions and tools
 * - Role-based access patterns
 * - Stateful execution context
 */

import { Client } from '@botpress/client'
import { execute, Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import { CLIChat } from '../utils/cli-chat'
import { printTrace } from '../utils/debug'
import chalk from 'chalk'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Display welcome message and instructions for the demo
console.log('👋 Welcome to the Conditional Tool Example!')
console.log("This example demonstrates how to conditionally show tools based on the user's identity.")
console.log(`You can log in as an "${chalk.bold('admin')}" or a "${chalk.bold('customer')}" to access different tools.`)
console.log(`The password for both is "${chalk.bold('password')}".`)
console.log(`You can also ${chalk.bold('logout')} at any time to return to the login screen.`)
console.log(chalk.dim('===========================\n\n'))

// Define user identity types for role-based access control
type Identity = 'admin' | 'customer' | 'unknown'

// Track current user's authentication state
// This state determines which tools and instructions are available
let userId: Identity = 'unknown'

// Simple credential store for demo purposes
// In production, this would integrate with proper authentication systems
const Credentials = {
  admin: 'password',
  customer: 'password',
} as const

// Authentication tool - allows users to log in with credentials
// Demonstrates how tools can modify application state
const login = new Tool({
  name: 'login',
  input: z.object({
    userId: z.enum(['admin', 'customer']),
    password: z.string(),
  }),
  output: z.object({
    userId: z.enum(['admin', 'customer']),
    success: z.boolean(),
  }),
  async handler(input) {
    // Validate credentials against our credential store
    if (!input.userId || Credentials[input.userId] !== input.password) {
      throw new Error('Invalid credentials')
    }

    // Update global authentication state
    userId = input.userId

    return {
      userId: input.userId,
      success: true,
    }
  },
})

// Admin-only tool for database operations
// Only available when user is authenticated as admin
const resetDatabase = new Tool({
  name: 'reset_database',
  description: 'Reset the database',
  async handler() {
    console.log('Database reset called')
  },
})

// Another admin-only tool for sensitive operations
const superSecretTool = new Tool({
  name: 'super_secret_tool',
  description: 'A super secret tool',
  async handler() {
    console.log('Super secret tool called')
  },
})

// Logout tool - available to all authenticated users
// Resets authentication state back to unknown
const logout = new Tool({
  name: 'logout',
  description: 'Logout the user',
  async handler() {
    userId = 'unknown'
    console.log('User logged out')
  },
})

// General tool available to both customers and admins
const customerTool = new Tool({
  name: 'general_tool',
  description: 'A general purpose tool for customers and admins',
  async handler() {
    console.log('Customer tool called')
  },
})

// Define tool sets for each user role
// This creates a role-based access control (RBAC) system
const ToolsForUser: Record<Identity, Tool[]> = {
  admin: [resetDatabase, superSecretTool, logout, customerTool], // Admins get all tools
  customer: [logout, customerTool], // Customers get limited tools
  unknown: [login], // Unauthenticated users can only login
}

login.getTypings()

// Define dynamic instructions based on user state
// Instructions change based on authentication status
const InstructionsForUser: Record<Identity, string> = {
  unknown: `The user is not authenticated. Please ask them to log in before proceeding. Use buttons to list users.`,
  admin: `User is logged in as "${userId}". At every turn, send a <Message> to the user with the list of all the tools available for the user and ask them to choose one. Use buttons to list tools.`,
  customer: `User is logged in as "${userId}". At every turn, send a <Message> to the user with the list of all the tools available for the user and ask them to choose one. Use buttons to list tools.`,
}

const chat = new CLIChat()

// Main execution loop with dynamic configuration
while (await chat.iterate()) {
  await execute({
    client,
    chat,

    // Use function-based instructions that evaluate at runtime
    // This allows instructions to change based on current user state
    instructions: () => InstructionsForUser[userId],

    // Use function-based tools that evaluate at runtime
    // This enables dynamic tool availability based on user permissions
    tools: () => ToolsForUser[userId],

    // Enable trace logging to see tool calls in action
    onTrace: ({ trace }) => printTrace(trace, ['tool_call']),
  })
}
