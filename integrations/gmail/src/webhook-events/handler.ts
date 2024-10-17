import { handleIncomingEmail } from './new-mail'
import { handleOAuthCallback } from './oauth-callback'
import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps) => {
  console.info('handler received a request')

  if (props.req.path.startsWith('/oauth')) {
    return handleOAuthCallback(props)
  }

  if (!(await _isWebhookEventProperlyAuthenticated(props))) {
    throw new Error('Incoming webhook event is not properly authenticated')
  }

  await handleIncomingEmail(props)
}

const _isWebhookEventProperlyAuthenticated = async (props: bp.HandlerProps) => _isSharedSecretValid(props)

const _isSharedSecretValid = ({ req }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const sharedSecret = searchParams.get('shared_secret')

  return sharedSecret === bp.secrets.WEBHOOK_SHARED_SECRET
}
