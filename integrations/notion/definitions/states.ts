import * as sdk from '@botpress/sdk'

export const states = {
  oauth: {
    type: 'integration',
    schema: sdk.z.object({
      authToken: sdk.z
        .string()
        .title('OAuth Authentication Token')
        .describe('The token used to authenticate with Notion. Currently, these tokens never expire'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
