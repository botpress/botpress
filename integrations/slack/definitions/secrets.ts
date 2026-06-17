import * as sdk from '@botpress/sdk'

export const secrets = {
  CLIENT_ID: {
    description: 'The client ID of your Slack OAuth app.',
  },

  CLIENT_SECRET: {
    description: 'The client secret of your Slack OAuth app.',
  },

  SIGNING_SECRET: {
    description: 'The signing secret of your Slack OAuth app used to verify requests signature.',
  },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
