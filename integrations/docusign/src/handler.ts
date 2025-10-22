import { exchangeAuthCodeForRefreshToken } from './docusign-api/auth-utils'
import { dispatchIntegrationEvent } from './webhooks/event-dispatcher'
import { parseWebhookEvent, verifyWebhookSignature } from './webhooks/utils'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  if (_isOauthRequest(props)) {
    const oAuthCode = new URLSearchParams(props.req.query).get('code')
    if (oAuthCode === null) throw new Error('Missing authentication code')

    await exchangeAuthCodeForRefreshToken(props, oAuthCode)
    return
  }

  const signatureResult = verifyWebhookSignature(props)
  if (!signatureResult.success) {
    props.logger.forBot().error(signatureResult.error.message, signatureResult.error)
    return
  }

  const result = parseWebhookEvent(props)
  if (!result.success) {
    props.logger.forBot().error(result.error.message, result.error)
    return
  }

  await dispatchIntegrationEvent(props, result.data)
}
