/**
 * Example 05: Web Search Integration
 *
 * This example demonstrates how to integrate web search capabilities with LLMz.
 * It shows how to:
 * - Configure web search tools with static parameters
 * - Chain search and browse operations for comprehensive research
 * - Use pre-configured tools from the utilities library
 * - Handle real-time information retrieval
 * - Combine multiple tools for complex workflows
 *
 * Key concepts:
 * - Tool configuration with setStaticInputValues()
 * - Two-step search workflow (search -> browse)
 * - Real-time data integration
 * - Tool chaining patterns
 * - External API integration through tools
 */

import { Client } from '@botpress/client'
import { execute } from 'llmz'

import { CLIChat } from '../utils/cli-chat'
import { browsePages, webSearch } from '../utils/tools/browser'
import { lightToolTrace } from '../utils/debug'

// Initialize Botpress client for LLM communication
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Configure web search tool with static parameters
// setStaticInputValues() pre-fills certain parameters to simplify LLM usage
const search = webSearch(client).setStaticInputValues({
  count: 10, // Return up to 10 search results
  browsePages: false, // Don't automatically browse pages, just return links
})

// Configure page browsing tool for fetching full content
// This tool extracts text content from web pages
const browse = browsePages(client).setStaticInputValues({
  waitFor: 0, // No delay when loading pages
})

const chat = new CLIChat()

// Main conversation loop with web search capabilities
while (await chat.iterate()) {
  await execute({
    client,
    chat,

    // Provide context about current date and available capabilities
    instructions: `
  The current date is ${new Date().toLocaleDateString()}.
  You are a helpful assistant that can search the web for information.
  You can call 'search' to get the pages, then call 'browse' to fetch the content of the most relevant page(s).`.trim(),

    // Provide both search and browse tools for comprehensive web research
    // Typical workflow: search() returns URLs -> browse() fetches content
    tools: [search, browse],

    // Enable trace logging to see web requests and tool interactions
    onTrace: ({ trace }) => lightToolTrace(trace),
  })
}
