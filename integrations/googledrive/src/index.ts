import { reporting } from '@botpress/sdk-addons'
import actions from './actions'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler,
})

export default reporting.wrapIntegration(integration)
