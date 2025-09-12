import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import actions from './actions'
import { handler, register, unregister } from './setup'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler: handler,
})
