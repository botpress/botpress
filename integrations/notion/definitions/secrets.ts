import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const secrets = {
  ...sentryHelpers.COMMON_SECRET_NAMES,
  CLIENT_ID: {
    description: 'The client ID of the Botpress Notion Integration.',
  },
  CLIENT_SECRET: {
    description: 'The client secret of the Botpress Notion Integration.',
  },
  WEBHOOK_VERIFICATION_SECRET: {
    description: 'The Notion-provided secret for verifying incoming webhooks.',
  },
  POSTHOG_KEY: {
    description: 'The Posthog key of the Botpress Notion Integration.',
  },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
