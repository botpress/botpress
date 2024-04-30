import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})
