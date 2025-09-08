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
    description: 'Get all products from BigCommerce and sync them to a Botpress table with background processing',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        success: z.boolean().describe('Whether the sync was successful'),
        message: z.string().describe('Status message'),
        productsCount: z.number().describe('Total number of products processed'),
        firstPageProcessed: z.number().describe('Number of products processed from first page'),
        totalPages: z.number().describe('Total number of pages'),
        backgroundProcessing: z.boolean().describe('Whether background processing was used'),
        lastProcessedPage: z.number().optional().describe('Last page processed during background processing'),
        backgroundErrors: z.array(z.string()).optional().describe('Errors encountered during background processing'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
