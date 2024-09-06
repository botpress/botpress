import * as bp from '.botpress'
import { register, unregister } from './setup'
import actions from './actions'
import channels from './channels'
import { handler } from './handler'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})
