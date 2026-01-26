import * as sdk from '@botpress/sdk'

export const secrets = {
  CLIENT_ID: {
    description: 'Botpress LinkedIn OAuth Client ID',
  },
  CLIENT_SECRET: {
    description: 'Botpress LinkedIn OAuth Client Secret',
  },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
