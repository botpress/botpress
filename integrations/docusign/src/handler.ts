import { exchangeAuthCodeForRefreshToken } from './docusign-api/auth-utils'
import { dispatchIntegrationEvent } from './webhooks/event-dispatcher'
import { parseWebhookEvent, verifyWebhookSignature } from './webhooks/utils'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  if (_isOauthRequest(props)) {
    const searchParams = new URLSearchParams(props.req.query)
    const error = searchParams.get('error')
    if (error) {
      return generateRedirection(
        getInterstitialUrl(false, `OAuth error: ${error} - ${searchParams.get('error_description') ?? ''}`)
      )
    }

    const oAuthCode = searchParams.get('code')
    if (oAuthCode === null) {
      return generateRedirection(getInterstitialUrl(false, 'Authorization code not present in OAuth callback'))
    }

    return await exchangeAuthCodeForRefreshToken(props, oAuthCode)
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
