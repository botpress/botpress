import { reporting } from '@botpress/sdk-addons'
import { actions } from './actions'
import { channels } from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})

export default reporting.wrapIntegration(integration)
