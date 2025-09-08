/**
 * Example 01: Basic Chat
 *
 * This example demonstrates the most basic usage of LLMz in chat mode.
 * It shows how to:
 * - Set up a Botpress client for LLM interactions
 * - Create a simple CLI chat interface
 * - Execute LLMz with basic instructions
 * - Handle conversation flow with automatic user interaction
 *
 * Key concepts:
 * - Chat mode execution with user interaction
 * - Basic instruction prompting
 * - Conversation history management
 */

import { Client } from '@botpress/client'
import { execute } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

// Initialize the Botpress Client for LLM interactions
// This client handles authentication and communication with language models
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!, // Your Botpress bot identifier
  token: process.env.BOTPRESS_TOKEN!, // Authentication token for API access
})

// Create a CLI chat interface that provides:
// - Command-line user input/output
// - Conversation history management
// - Message formatting and display
const chat = new CLIChat()

// Main conversation loop
// chat.iterate() returns true until an exit is detected or iterations exceeded
// chat.iterate captures user input and manages conversation state
while (await chat.iterate()) {
  // Execute LLMz with the user's message and conversation context
  await execute({
    // Instructions define the agent's role and behavior
    instructions:
      "You are a helpful assistant. Greet the user and suggest topics for discussion using buttons. Don't let users type themselves, suggest topics instead.",

    // Pass the chat interface to enable interactive conversation
    // This automatically adds the user's message to the execution context
    chat,

    // The Botpress client for LLM communication
    client,
  })
}
