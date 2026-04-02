import { channels } from './channels/outbound'
import { register, unregister } from './setup'
import { handler } from './webhook/handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions: {},
  channels,
  handler,
})
