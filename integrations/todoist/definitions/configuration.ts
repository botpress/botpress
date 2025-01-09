import sdk, { z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({}),
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
    required: true,
  },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = {
  apiToken: {
    title: 'Manual configuration',
    description: 'Configure manually by supplying an API token',
    schema: z.object({
      apiToken: z.string().title('API Token').describe('The API token to authenticate with the Todoist API'),
    }),
  },
} satisfies sdk.IntegrationDefinitionProps['configurations']

export const identifier = {
  extractScript: 'extract.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']
