import * as sdk from '@botpress/sdk'

export const secrets = {
  CLIENT_ID: { description: 'Google OAuth Client ID' },
  CLIENT_SECRET: { description: 'Google OAuth Client Secret' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
