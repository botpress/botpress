import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const secrets = {
  ...posthogHelper.COMMON_SECRET_NAMES,
  CLIENT_ID: { description: 'Google OAuth Client ID' },
  CLIENT_SECRET: { description: 'Google OAuth Client Secret' },
  FILE_PICKER_API_KEY: { description: 'The API key used to access the Google Picker API' },
} as const satisfies sdk.IntegrationDefinitionProps['secrets']
