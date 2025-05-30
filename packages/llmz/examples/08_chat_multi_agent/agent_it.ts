import { Tool } from 'llmz'
import type { SubAgent } from './orchestrator'
import { z } from '@bpinternal/zui'

const resetPassword = new Tool({
  name: 'resetPassword',
  description: "Reset a user's password",
  input: z.object({
    userId: z.string().describe('User ID'),
    newPassword: z.string().describe('New password for the user'),
  }),
  output: z.object({
    success: z.boolean().describe('Whether the password was reset successfully'),
    message: z.string().describe('Confirmation message'),
  }),
  async handler({ userId }) {
    // Simulate resetting a password
    console.log(`Resetting password for user ${userId}`)
    return {
      success: true,
      message: `Password for user ${userId} has been reset successfully.`,
    }
  },
})

const getITPolicies = new Tool({
  name: 'getITPolicies',
  description: 'Get information about IT policies',
  output: z.object({
    policies: z.array(z.string()).describe('List of IT policies'),
  }),
  async handler() {
    // Simulate fetching IT policies
    console.log('Fetching IT policies')
    return {
      policies: [
        'Password complexity requirements',
        'Data encryption standards',
        'Incident response procedures',
        'Acceptable use policy',
        'Software installation guidelines',
      ],
    }
  },
})

const getTechnicalSupport = new Tool({
  name: 'reportTechnicalIssue',
  description: 'Report a technical issue',
  input: z.object({
    issueDescription: z.string().describe('Description of the technical issue'),
  }),
  output: z.object({
    success: z.boolean().describe('Whether the issue was reported successfully'),
    ticketId: z.string().describe('Ticket ID for the reported issue'),
  }),
  async handler({ issueDescription }) {
    // Simulate reporting a technical issue
    console.log(`Reporting technical issue: ${issueDescription}`)
    return {
      success: true,
      ticketId: `TICKET-${Math.floor(Math.random() * 10000)}`,
    }
  },
})

export const ITAgent: SubAgent = {
  name: 'it',
  description: 'Agent specialized in IT-related inquiries.',
  positive_examples: [
    'How do I reset my password?',
    'Can you help me with a technical issue?',
    "What are the company's IT security policies?",
  ],
  instructions: `You are an IT agent that handles IT-related inquiries.
You respond with specific information about IT policies, procedures, and technical support.
You provide clear and concise answers to IT-related questions.
When a user reports a technical issue, you log the issue and provide a ticket ID for tracking.`,
  tools: [resetPassword, getITPolicies, getTechnicalSupport],
}
