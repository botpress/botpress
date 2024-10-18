import { JWTVerifier } from 'src/google-api'
import { handleIncomingEmail } from './new-mail'
import { handleOAuthCallback } from './oauth-callback'
import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps) => {
  console.info('handler received a request')

  if (props.req.path.startsWith('/oauth')) {
    return handleOAuthCallback(props)
  }

  if (!(await _isWebhookEventProperlyAuthenticated(props))) {
    throw new Error('Incoming webhook event is not properly authenticated', { cause: props.req })
  }

  await handleIncomingEmail(props)
}

const _isWebhookEventProperlyAuthenticated = async (props: bp.HandlerProps) =>
  _isSharedSecretValid(props) && (await _isJWTValid(props))

const _isSharedSecretValid = ({ req }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const sharedSecret = searchParams.get('shared_secret')

  return sharedSecret === bp.secrets.WEBHOOK_SHARED_SECRET
}

const _isJWTValid = async ({ req, client, ctx }: bp.HandlerProps) => {
  const authorizationHeader = req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return false
  }

  const bearerToken = authorizationHeader.slice(7)
  const jwtVerifier = new JWTVerifier({ client, ctx })

  return await jwtVerifier.isJWTProperlySigned(bearerToken)
}
