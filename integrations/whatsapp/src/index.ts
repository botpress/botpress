import { posthog } from '@botpress/common'
import { INTEGRATION_NAME } from 'integration.definition'
import actions from './actions'
import channels from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})

export default posthog.wrapIntegration(integration, {
  integrationName: INTEGRATION_NAME,
  key: bp.secrets.POSTHOG_KEY,
})
