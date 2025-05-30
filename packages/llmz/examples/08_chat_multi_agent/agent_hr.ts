import { Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import type { SubAgent } from './orchestrator'

const bookVacation = new Tool({
  name: 'bookVacation',
  description: 'Book a vacation for an employee',
  input: z.object({
    employeeId: z.string().describe('Employee ID'),
    startDate: z.string().describe('Start date of the vacation'),
    endDate: z.string().describe('End date of the vacation'),
  }),
  output: z.object({
    success: z.boolean().describe('Whether the vacation was booked successfully'),
    message: z.string().describe('Confirmation message'),
  }),
  async handler({ employeeId, startDate, endDate }) {
    // Simulate booking a vacation
    console.log(`Booking vacation for employee ${employeeId} from ${startDate} to ${endDate}`)
    return {
      success: true,
      message: `Vacation booked successfully for employee ${employeeId} from ${startDate} to ${endDate}.`,
    }
  },
})

const getBenefits = new Tool({
  name: 'getEmployeeBenefits',
  description: 'Get information about employee benefits',
  input: z.string().describe('Employee ID'),
  output: z.object({
    employeeId: z.string().describe('Employee ID'),
    benefits: z.array(z.string()).describe('List of employee benefits'),
  }),
  async handler(employeeId) {
    // Simulate fetching employee benefits
    console.log(`Fetching benefits for employee ${employeeId}`)
    return {
      employeeId,
      benefits: [
        'Health insurance',
        'Retirement plan',
        'Paid time off',
        'Employee discounts',
        'Professional development opportunities',
      ],
    }
  },
})

export const HRAgent: SubAgent = {
  name: 'hr',
  description: 'Agent specialized in HR-related inquiries.',
  positive_examples: [
    "What is the company's policy on vacation days?",
    'How do I apply for a leave of absence?',
    'Can you provide information about employee benefits?',
  ],
  instructions: `You are an HR agent that handles HR-related inquiries.
You respond with specific information about HR policies, procedures, and benefits.
You provide clear and concise answers to HR-related questions.`,
  tools: [bookVacation, getBenefits],
}
