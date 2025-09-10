import actions from './actions'
import { handler } from './handler'
import { LoopsApi } from './loops.api'
import { validateWebhookSigningSecret } from './loops.webhook'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const loops = new LoopsApi(props.ctx.configuration.apiKey, props.logger.forBot())
    await loops.verifyApiKey()

    validateWebhookSigningSecret(props.ctx.configuration.webhookSigningSecret)
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler,
})
