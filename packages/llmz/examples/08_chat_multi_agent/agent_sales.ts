import { Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import type { SubAgent } from './orchestrator'

const getCurrentPromotions = new Tool({
  name: 'getCurrentPromotions',
  description: 'Get the current sales promotions',
  output: z.any().describe('Current promotions information'),
  async handler() {
    // Simulate fetching current promotions
    return {
      promotions: [
        { id: 1, name: 'Spring Sale', discount: '20%' },
        { id: 2, name: 'Summer Clearance', discount: '30%' },
      ],
    }
  },
})

const getProductPricing = new Tool({
  name: 'getProductPricing',
  description: 'Get product pricing information',
  input: z.string().describe('Product ID or name'),
  output: z.object({
    productId: z.string(),
    price: z.number(),
  }),
  async handler(productId) {
    // Simulate fetching product pricing
    return { productId, price: 99.99 }
  },
})

export const SalesAgent: SubAgent = {
  name: 'sales',
  description: 'Agent specialized in sales-related inquiries.',
  positive_examples: [
    'What are the current promotions?',
    'Can you provide information about product pricing?',
    'How do I place an order?',
  ],
  tools: [getCurrentPromotions, getProductPricing],
  instructions: `You are a sales agent that handles sales-related inquiries.
You respond with specific information about sales policies, procedures, and promotions.
You provide clear and concise answers to sales-related questions.`,
}
