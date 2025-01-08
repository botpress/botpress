import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const secrets = {
  ...sentryHelpers.COMMON_SECRET_NAMES,
  CLIENT_ID: { description: 'Google OAuth Client ID' },
  CLIENT_SECRET: { description: 'Google OAuth Client Secret' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
