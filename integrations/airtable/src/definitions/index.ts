import type { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { actions } from './actions'
import { channels } from './channels'

export { actions }
export { channels }

export const configuration = {
  schema: z.object({
    accessToken: z.string().describe('Personal Access Token'),
    baseId: z.string().describe('Base ID'),
    endpointUrl: z
      .string()
      .optional()
      .default('https://api.airtable.com/v0/')
      .describe('API endpoint to hit (Default: https://api.airtable.com/v0/)'),
  }),
}

export const states: IntegrationDefinitionProps['states'] = {}

export const user = {
  tags: {},
}
