import { Signature } from '@hubspot/api-client'
import { getClientSecret } from '../auth'
import * as handlers from './handlers'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  logger.debug(`Received request on ${req.path}: ${JSON.stringify(req.body, null, 2)}`)
  if (handlers.isOAuthCallback(props)) {
    return await handlers.handleOAuthCallback(props)
  }

  const validation = _validateRequestAuthentication(props)
  if (validation.error) {
    logger.error(`Error validating request: ${validation.message}`)
    return { status: 401, body: validation.message }
  }

  if (handlers.isBatchUpdateEvent(props)) {
    return await handlers.handleBatchUpdateEvent(props)
  }

  logger.warn(`No handler found for request on '/${req.path}'`)
  return { status: 404, body: 'No handler found' }
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
