import * as sdk from '@botpress/sdk'

export const secrets = {
  CLIENT_ID: {
    description: 'The client ID of the Botpress Notion Integration.',
  },
  CLIENT_SECRET: {
    description: 'The client secret of the Botpress Notion Integration.',
  },
  WEBHOOK_VERIFICATION_SECRET: {
    description: 'The Notion-provided secret for verifying incoming webhooks.',
  },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
