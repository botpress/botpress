import sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const secrets = {
  ...sentryHelpers.COMMON_SECRET_NAMES,
  APP_KEY: { description: 'Dropbox App Key' },
  APP_SECRET: { description: 'Dropbox App Secret' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
