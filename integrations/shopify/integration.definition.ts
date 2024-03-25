import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from './src/const'
import { actions } from './src/definitions/actions'
import { configuration } from './src/definitions/configuration'
import { events } from './src/definitions/events'
import { states } from './src/definitions/states'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Shopify',
  description: 'This integration allows your bot to interact with Shopify.',
  version: '0.2.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  actions,
  states,
  events,
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
