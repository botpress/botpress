import actions from './actions'
import { LoopsApi } from './loops.api'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const loops = new LoopsApi(props.ctx.configuration.apiKey, props.logger.forBot())
    await loops.verifyApiKey()
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
