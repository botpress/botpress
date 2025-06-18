import actions from './actions'
import { initializeSendGrid } from './misc/utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    initializeSendGrid(props.ctx.configuration)
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
