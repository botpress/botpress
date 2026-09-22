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

import { CLIChat } from '../utils/cli-chat'
import { Client } from '@botpress/client'
import { execute } from 'llmz'

// Initialize the Botpress Client for LLM interactions
// This client handles authentication and communication with language models
const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
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
    // Use a model that supports assistant text alongside native tool calls.
    model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
    // Instructions define the agent's role and behavior
    instructions: `You are a helpful assistant having a guided conversation.
On the first turn, say exactly "Hi! What would you like to talk about?" as visible assistant text, and offer three topics as buttons in the same response.
On later turns, answer the selected topic in a short assistant text message and offer related follow-up buttons.
Always include both assistant text and buttons: write the text before the run_javascript tool call,
then send the buttons with chat.buttons and return exit("listen"). Button labels do not replace your reply.
Users can choose a button or type their own question.`,

    // Pass the chat interface to enable interactive conversation
    // The session holds pending input and retained conversation state.
    chat,
    session: chat.session,

    // The Botpress client for LLM communication
    client,
  })
}
