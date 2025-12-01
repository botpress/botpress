import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { actions } from './actions'
import { channels } from './channels'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

export default sentryHelpers.wrapIntegration(
  new bp.Integration({
    register,
    unregister,
    actions,
    channels,
    handler,
  }),
  {}
)
