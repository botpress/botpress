import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'

export const configuration = {
  schema: z.object({
    apiKey: z.string().describe('Your API Key'),
    serverPrefix: z.string().describe('Your Server Prefix'),
  }),
} satisfies IntegrationDefinitionProps['configuration']
