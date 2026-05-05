import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const secrets = {
  CLIENT_ID: {
    description: 'Botpress LinkedIn OAuth Client ID',
  },
  CLIENT_SECRET: {
    description: 'Botpress LinkedIn OAuth Client Secret',
  },
  ...posthogHelper.COMMON_SECRET_NAMES,
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
