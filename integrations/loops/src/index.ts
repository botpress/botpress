import { sendTransactionalEmail } from './actions/send-transactional-email'
import { LoopsApi } from './loops.api'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const loops = new LoopsApi(props.ctx.configuration.apiKey, props.logger.forBot())
    await loops.verifyApiKey()
  },
  unregister: async () => {},
  actions: {
    sendTransactionalEmail,
  },
  channels: {},
  handler: async () => {},
})
