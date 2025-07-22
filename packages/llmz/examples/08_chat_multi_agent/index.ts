/**
 * Example 08: Multi-Agent System
 * 
 * This example demonstrates a sophisticated multi-agent orchestration system.
 * It shows how to:
 * - Implement multiple specialized agents (HR, IT, Sales)
 * - Use an orchestrator to coordinate agent interactions
 * - Handle agent handoffs and context switching
 * - Maintain conversation flow across different agent specializations
 * - Build complex agent hierarchies and routing
 * 
 * Key concepts:
 * - Multi-agent orchestration patterns
 * - Agent specialization and routing
 * - Context spreading with spread operator
 * - Handoff detection and management
 * - Conversational state management across agents
 */

import { Client } from '@botpress/client'
import { execute } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

// Import specialized agent definitions
import { MainAgent } from './agent_main'    // Entry point/coordinator agent
import { HRAgent } from './agent_hr'        // Human Resources specialist
import { ITAgent } from './agent_it'        // Information Technology specialist
import { SalesAgent } from './agent_sales'  // Sales and marketing specialist

// Import the orchestration system
import { MultiAgentOrchestrator } from './orchestrator'

// Initialize Botpress client for LLM communication
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Set up chat interface and orchestrator
const chat = new CLIChat()

// Create orchestrator with all agents and set MainAgent as entry point
// The orchestrator manages agent selection, context, and handoffs
const orchestrator = new MultiAgentOrchestrator(
  [MainAgent, HRAgent, ITAgent, SalesAgent],  // Available agents
  MainAgent.name                              // Initial/default agent
)

// Main execution loop with agent orchestration
while (true) {
  // Execute with the current agent's context
  // The orchestrator provides the appropriate instructions, tools, and configuration
  const result = await execute({
    // Spread the orchestrator's context (instructions, tools, exits, etc.)
    // This dynamically configures the execution based on the current agent
    ...orchestrator.context,
    client,
    chat,
  })

  // Check if the current agent has handed off control to another agent
  if (!orchestrator.hasHandedOff(result)) {
    // No handoff occurred - continue with user input
    // Wait for the next user message to continue the conversation
    await chat.prompt()
  }
  // If handoff occurred, the orchestrator has already switched contexts
  // Continue the loop with the new agent's configuration
}
