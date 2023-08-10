import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { register, unregister } from './setup'
import { Integration } from '.botpress'

const integration = new Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})

export default integration
