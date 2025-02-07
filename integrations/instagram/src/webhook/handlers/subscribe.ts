import { getVerifyToken } from 'src/misc/client'
import * as bp from '.botpress'

export const subscribeHandler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { req, ctx } = props

  const queryParams = new URLSearchParams(req.query)
  const mode = queryParams.get('hub.mode')
  if (mode !== 'subscribe') {
    return { status: 400, body: "Mode should be set to 'subscribe'" }
  }

  const token = queryParams.get('hub.verify_token')
  const challenge = queryParams.get('hub.challenge')
  if (!token || !challenge) {
    return { status: 400, body: 'Missing required query parameters' }
  }

  if (token !== getVerifyToken(ctx)) {
    return { status: 403, body: 'Invalid verify token' }
  }

  return {
    status: 200,
    body: challenge,
  }
}
