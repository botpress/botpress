import * as bp from '.botpress'
import { register, unregister, handler } from './setup'

export default new bp.Integration({
  register,
  unregister,
  handler,
  actions: {},
  channels: {},
})
