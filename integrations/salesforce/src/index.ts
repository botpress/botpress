import * as botpress from '.botpress'

import actions from './actions'
import { register, unregister, channels, handler } from './setup'

export default new botpress.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})
