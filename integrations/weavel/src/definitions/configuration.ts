import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export const configuration = {
  schema: z
    .object({
      apiKey: z.string().describe('Project API Key for Weavel'),
    })
    .describe('Configuration schema for Weavel integration'),
} satisfies IntegrationDefinitionProps['configuration']
