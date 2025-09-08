import { ConfigurationDefinition, z } from '@botpress/sdk'

export { actions } from './actions'
export * as schemas from './schemas'

export const configuration = {
  schema: z.object({
    apiKey: z.string().title('Loops API Key').describe('The API key for Loops'),
  }),
} as const satisfies ConfigurationDefinition