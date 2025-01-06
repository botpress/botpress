import sdk, { z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    apiToken: z.string().optional().title('API Token').describe('The API token to authenticate with the Todoist API'),
  }),
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = undefined satisfies sdk.IntegrationDefinitionProps['configurations']

export const identifier = {
  extractScript: 'extract.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']
