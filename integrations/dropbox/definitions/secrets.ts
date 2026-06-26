import sdk from '@botpress/sdk'

export const secrets = {
  APP_KEY: { description: 'Dropbox App Key' },
  APP_SECRET: { description: 'Dropbox App Secret' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
