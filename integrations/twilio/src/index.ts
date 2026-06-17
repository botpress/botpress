import { reporting } from '@botpress/sdk-addons'
import { actions } from './actions'
import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels,
  handler,
})

export default reporting.wrapIntegration(integration)
