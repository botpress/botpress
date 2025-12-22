import * as sdk from '@botpress/sdk'

export const configuration = {
  schema: sdk.z.object({}),
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
    required: true,
  },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const identifier = {
  extractScript: 'extract.vrl',
  fallbackHandlerScript: 'fallbackHandler.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']

export const configurations = {
  customApp: {
    title: 'Manual configuration with a custom Notion integration',
    description: 'Configure the integration using a Notion integration token.',
    schema: sdk.z.object({
      internalIntegrationSecret: sdk.z
        .string()
        .min(1)
        .title('Internal Integration Secret')
        .describe('Can be found on Notion in your integration settings under the Configuration tab.'),
      webhookVerificationSecret: sdk.z
        .string()
        .min(1)
        .title('Webhook Verification Secret')
        .describe('Can be found on Notion in your integration settings under the Webhooks tab.'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']
