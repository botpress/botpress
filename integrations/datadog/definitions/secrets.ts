import { posthogHelper } from '@botpress/common'
import { default as sdk } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export const secrets = {
  ...sentryHelpers.COMMON_SECRET_NAMES,
  ...posthogHelper.COMMON_SECRET_NAMES,
} as const satisfies sdk.IntegrationDefinitionProps['secrets']

