import { Signature } from '@hubspot/api-client'
import { getClientSecret } from '../auth'
import { oauthCallbackHandler } from './handlers/oauth'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  logger.debug(`Received request on ${req.path}: ${JSON.stringify(req.body, null, 2)}`)
  if (req.path.startsWith('/oauth')) {
    return await oauthCallbackHandler(props)
  }

  const validation = _validateRequestAuthentication(props)
  if (validation.error) {
    logger.error(`Error validating request: ${validation.message}`)
    return { status: 401, body: validation.message }
  }
}

const _validateRequestAuthentication = ({ req, ctx }: bp.HandlerProps) => {
  const clientSecret = getClientSecret(ctx)
  if (!clientSecret) {
    return { error: false }
  }

  const signature = req.headers['x-hubspot-signature']
  if (!signature) {
    return { error: true, message: 'Missing "x-hubspot-signature" header' }
  }

  const isValid = Signature.isValid({
    clientSecret,
    requestBody: req.body ?? '',
    signature,
  })
  if (!isValid) {
    return { error: true, message: 'Invalid signature' }
  }

  return { error: false }
}
