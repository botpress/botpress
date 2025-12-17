import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const secrets = {
  ...posthogHelper.COMMON_SECRET_NAMES,
  CLIENT_ID: { description: 'Gmail Client ID' },
  CLIENT_SECRET: { description: 'Gmail Client Secret' },
  TOPIC_NAME: { description: 'Google Cloud Pub/Sub topic name for Gmail messages' },
  WEBHOOK_SHARED_SECRET: { description: 'Pub/Sub webhook shared secret' },
  WEBHOOK_SERVICE_ACCOUNT: { description: 'Pub/Sub JWT service account' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
