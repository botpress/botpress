import { exchangeAuthCodeForRefreshToken } from './docusign-api/auth'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  if (_isOauthRequest(props)) {
    const oAuthCode = new URLSearchParams(props.req.query).get('code')
    if (oAuthCode === null) throw new Error('Missing authentication code')

    await exchangeAuthCodeForRefreshToken(props, oAuthCode)
    return
  }
}
