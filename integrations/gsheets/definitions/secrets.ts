import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const secrets = {
  ...posthogHelper.COMMON_SECRET_NAMES,
  CLIENT_ID: { description: 'Google OAuth Client ID' },
  CLIENT_SECRET: { description: 'Google OAuth Client Secret' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
