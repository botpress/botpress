import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const secrets = {
  ...sentryHelpers.COMMON_SECRET_NAMES,
  CLIENT_ID: { description: 'Gmail Client ID' },
  CLIENT_SECRET: { description: 'Gmail Client Secret' },
  TOPIC_NAME: {},
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
