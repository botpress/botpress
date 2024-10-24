import * as sdk from '@botpress/sdk'
const { z } = sdk

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({}),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = {
  customApp: {
    title: 'Manual configuration',
    description: 'Configure manually with your own GCP App',
    schema: z.object({
      oauthClientId: z
        .string()
        .min(1)
        .endsWith('.apps.googleusercontent.com')
        .title('OAuth Client ID')
        .describe('Can be found in GCC under API & Services > Credentials'),
      oauthClientSecret: z
        .string()
        .min(1)
        .title('OAuth Client Secret')
        .describe('Can be found in GCC under API & Services > Credentials'),
      oauthAuthorizationCode: z
        .string()
        .min(1)
        .title('OAuth Authorization Code')
        .describe('Obtained by running the OAuth flow in your browser'),
      pubsubTopicName: z
        .string()
        .min(1)
        .startsWith('projects/')
        .includes('/topics/')
        .title('Pub/Sub Topic Name')
        .describe('Can be found in GCC under Pub/Sub > Topics'),
      pubsubWebhookSharedSecret: z
        .string()
        .min(1)
        .title('Pub/Sub Webhook Shared Secret')
        .describe('Must be set in GCC under Pub/Sub > Subscriptions'),
      pubsubWebhookServiceAccount: z
        .string()
        .min(1)
        .title('Pub/Sub Webhook Service Account')
        .describe('Must be set in GCC under Pub/Sub > Subscriptions'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']

export const identifier = {
  extractScript: 'extract.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']
