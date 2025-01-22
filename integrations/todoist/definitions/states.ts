import * as sdk from '@botpress/sdk'

export const states = {
  credentials: {
    type: 'integration',
    schema: sdk.z.object({
      accessToken: sdk.z
        .string()
        .title('Access Token')
        .describe('The access token used to communicate with the Todoist API'),
    }),
  },

  // TODO: This state is unused. Delete it in the next major version.
  configuration: {
    type: 'integration',
    schema: sdk.z.object({
      botUserId: sdk.z.string().optional().title('Bot User ID').describe('The ID of the bot user in Todoist'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
