import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    storeHash: z
      .string({
        description: 'Your BigCommerce store hash (e.g., abc123)',
      })
      .min(1),
    accessToken: z
      .string({
        description: 'BigCommerce API Access Token',
      })
      .min(1),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {} satisfies IntegrationDefinitionProps['states']

export const actions = {
  syncProducts: {
    title: 'Sync Products',
    description: 'Get all products from BigCommerce and sync them to a Botpress table',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        success: z.boolean().describe('Whether the sync was successful'),
        message: z.string().describe('Status message'),
        productsCount: z.number().describe('Number of products synced'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
