import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { getClient } from './client'
import { register, unregister, handler } from './setup'
import actions from './actions'
import { channels } from './channels'

export default new bp.Integration({
  register,
  unregister,
  actions,
  handler,
  channels,
})
