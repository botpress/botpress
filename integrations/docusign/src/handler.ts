import { exchangeAuthCodeForRefreshToken } from './docusign-api/auth-utils'
import { dispatchIntegrationEvent } from './webhooks/event-dispatcher'
import { parseWebhookEvent, verifyWebhookSignature } from './webhooks/utils'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  if (_isOauthRequest(props)) {
    try {
      const searchParams = new URLSearchParams(props.req.query)
      const error = searchParams.get('error')
      if (error) {
        throw new Error(`${error} - ${searchParams.get('error_description') ?? ''}`)
      }

      const oAuthCode = searchParams.get('code')
      if (!oAuthCode) {
        throw new Error('Authorization code not present in OAuth callback')
      }

      await exchangeAuthCodeForRefreshToken(props, oAuthCode)
      return generateRedirection(getInterstitialUrl(true))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const errorMessage = 'OAuth error: ' + msg
      props.logger.forBot().error(errorMessage)
      return generateRedirection(getInterstitialUrl(false, errorMessage))
    }
  }

  const signatureResult = verifyWebhookSignature(props)
  if (!signatureResult.success) {
    props.logger.forBot().error(signatureResult.error.message, signatureResult.error)
    return {}
  }

  const result = parseWebhookEvent(props)
  if (!result.success) {
    props.logger.forBot().error(result.error.message, result.error)
    return {}
  }

  await dispatchIntegrationEvent(props, result.data)
  return {}
}
