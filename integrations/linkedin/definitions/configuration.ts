import * as sdk from '@botpress/sdk'

const { z } = sdk

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
    required: true,
  },
  schema: z.object({}),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = {
  manual: {
    title: 'Manual Configuration',
    description: 'Configure with your own LinkedIn Developer application',
    schema: z.object({
      clientId: z.string().min(1).title('Client ID').describe('Client ID from your LinkedIn Developer application'),
      clientSecret: z
        .string()
        .min(1)
        .secret()
        .title('Client Secret')
        .describe('Primary Client Secret from your LinkedIn Developer application'),
      authorizationCode: z.string().min(1).secret().title('Authorization Code').describe('Authorization Code'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']

export const identifier = {
  extractScript: 'extract.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']
