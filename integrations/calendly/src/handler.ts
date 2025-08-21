import { exchangeAuthCodeForRefreshToken } from './calendly-api/auth'
import { dispatchIntegrationEvent } from './webhooks/event-dispatcher'
import { parseWebhookData } from './webhooks/webhook-utils'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
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
}
