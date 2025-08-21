import actions from './actions'
import { exchangeAuthCodeForRefreshToken } from './calendly-api/auth'
import { register, unregister } from './setup'
import { dispatchIntegrationEvent } from './webhooks/event-dispatcher'
import { parseWebhookData } from './webhooks/webhook-utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler: async (props: bp.HandlerProps) => {
    if (_isOauthRequest(props)) {
      await exchangeAuthCodeForRefreshToken(props)
      return
    }

    const result = parseWebhookData(props)
    if (!result.success) {
      props.logger.forBot().error(result.error.message, result.error)
      return
    }

    await dispatchIntegrationEvent(props, result.data)
  },
})

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'
