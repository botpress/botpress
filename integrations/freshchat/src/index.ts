import { actions } from './definitions/actions'
import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  actions,
  channels,
  handler
})
