import { Client } from '@botpress/client'
import { execute, Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import { CLIChat } from '../utils/cli-chat'
import { printTrace } from '../utils/debug'
import chalk from 'chalk'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

console.log('👋 Welcome to the Conditional Tool Example!')
console.log("This example demonstrates how to conditionally show tools based on the user's identity.")
console.log(`You can log in as an "${chalk.bold('admin')}" or a "${chalk.bold('customer')}" to access different tools.`)
console.log(`The password for both is "${chalk.bold('password')}".`)
console.log(`You can also ${chalk.bold('logout')} at any time to return to the login screen.`)
console.log(chalk.dim('===========================\n\n'))

type Identity = 'admin' | 'customer' | 'unknown'
let userId: Identity = 'unknown'

const Credentials = {
  admin: 'password',
  customer: 'password',
} as const

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
    if (!input.userId || Credentials[input.userId] !== input.password) {
      throw new Error('Invalid credentials')
    }

    userId = input.userId

    return {
      userId: input.userId,
      success: true,
    }
  },
})

const resetDatabase = new Tool({
  name: 'reset_database',
  description: 'Reset the database',
  async handler() {
    console.log('Database reset called')
  },
})

const superSecretTool = new Tool({
  name: 'super_secret_tool',
  description: 'A super secret tool',
  async handler() {
    console.log('Super secret tool called')
  },
})

const logout = new Tool({
  name: 'logout',
  description: 'Logout the user',
  async handler() {
    userId = 'unknown'
    console.log('User logged out')
  },
})

const customerTool = new Tool({
  name: 'general_tool',
  description: 'A general purpose tool for customers and admins',
  async handler() {
    console.log('Customer tool called')
  },
})

const ToolsForUser: Record<Identity, Tool[]> = {
  admin: [resetDatabase, superSecretTool, logout, customerTool],
  customer: [logout, customerTool],
  unknown: [login],
}

const InstructionsForUser: Record<Identity, string> = {
  unknown: `The user is not authenticated. Please ask them to log in before proceeding. Use buttons to list users.`,
  admin: `User is logged in as "${userId}". At every turn, send a <Message> to the user with the list of all the tools available for the user and ask them to choose one. Use buttons to list tools.`,
  customer: `User is logged in as "${userId}". At every turn, send a <Message> to the user with the list of all the tools available for the user and ask them to choose one. Use buttons to list tools.`,
}

const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    client,
    chat,
    instructions: () => InstructionsForUser[userId],
    tools: () => ToolsForUser[userId],
    onTrace: ({ trace }) => printTrace(trace, ['tool_call']),
  })
}
