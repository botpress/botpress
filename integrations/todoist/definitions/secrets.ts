import sdk from '@botpress/sdk'

export const secrets = {
  CLIENT_ID: {
    optional: false,
    description: 'Client ID in the App Management page of your Todoist app',
  },
  CLIENT_SECRET: {
    optional: false,
    description: 'Client Secret in the App Management page of your Todoist app',
  },
  WEBHOOK_SHARED_SECRET: {
    optional: false,
    description: 'Webhook shared secret',
  },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
