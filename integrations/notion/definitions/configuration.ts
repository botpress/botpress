import * as sdk from '@botpress/sdk'

export const configuration = {
  schema: sdk.z.object({}),
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
    required: true,
  },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const identifier = {} as const satisfies sdk.IntegrationDefinitionProps['identifier']

export const configurations = {
  customApp: {
    title: 'Manual configuration with a custom Notion integration',
    description: 'Configure the integration using a Notion integration token.',
    schema: sdk.z.object({
      authToken: sdk.z
        .string()
        .min(1)
        .title('Notion Integration Token')
        .describe('Can be found on Notion in your integration settings.'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']
