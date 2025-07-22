/**
 * Example 07: Code Guardrails and Safety
 * 
 * This example demonstrates how to implement safety guardrails for generated code.
 * It shows how to:
 * - Use Zai for automated code analysis and safety checks
 * - Define custom guardrail rules for different safety concerns
 * - Implement pre-execution validation with onBeforeExecution
 * - Handle guardrail violations with ThinkSignal feedback
 * - Create a safety-first code generation workflow
 * 
 * Key concepts:
 * - Pre-execution safety validation
 * - AI-powered content analysis with Zai
 * - Guardrail violation handling
 * - ThinkSignal for iterative code improvement
 * - Safety-compliant code generation
 */

import { Client } from '@botpress/client'
import { execute, ThinkSignal } from 'llmz'
import Zai from '@botpress/zai'
import { CLIChat } from '../utils/cli-chat'
import chalk from 'chalk'
import { loading } from '../utils/spinner'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Initialize Zai for AI-powered content analysis
// Zai provides intelligent labeling and classification capabilities
const zai = new Zai.Zai({
  client,
})

// Define guardrail rules for code safety validation
// Each rule defines what should be checked and the expected result
const guardrails = {
  violence: 'The code is free of violence or threats. (true = no violence, false = contains violence)',
  hate: 'The code is free of hate speech or discrimination. (true = no hate speech, false = contains hate speech)',
  pii: 'The code does not collect or use personal data. (true = no personal data, false = collects personal data)',
  french: 'The code does not use French language. (true = no French, false = contains French)',
} as const

const chat = new CLIChat()

// Main execution loop with safety guardrails
while (await chat.iterate()) {
  await execute({
    client,
    chat,
    instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',
    
    // Pre-execution safety validation
    // This runs before any generated code is executed
    async onBeforeExecution(iteration) {
      // Show loading indicator while checking safety
      loading(true, chalk.dim('👀 Checking guardrails...'))
      
      // Use Zai to analyze the generated code against our guardrails
      const checks = await zai.label(iteration.code, guardrails)
      loading(false)

      // Collect any guardrail violations
      const breaches: string[] = []

      for (const [guardrail, result] of Object.entries(checks)) {
        if (result.value === false) {
          // Guardrail violated - record the violation with explanation
          breaches.push(
            `Guardrail "${guardrails[guardrail as keyof typeof guardrails]}" violated: ${result.explanation}.`
          )
        }
      }

      // Handle guardrail violations
      if (breaches.length > 0) {
        // Display violations to console for debugging
        console.log(chalk.red('🚨 Code violates guardrails: ' + breaches.map((x) => '- ' + x).join('\n')))
        
        // Use ThinkSignal to provide feedback to the LLM
        // This causes the LLM to regenerate code that complies with guardrails
        const message = `🚨 Code violates the following guardrails:\n\n${breaches.join('\n')}\n\nPlease fix the code to comply with the guardrails and try again. Do not mention the error to the user.`
        throw new ThinkSignal(message)
      } else {
        // All guardrails passed - safe to execute
        console.log(chalk.green('✓') + chalk.dim(' guardrails ok'))
      }
    },
  })
}
