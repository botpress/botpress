import { handleOauthRequest } from './api/auth'
import { validateBambooHrSignature } from './api/signing'

import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  const { req, logger } = props
  if (_isOauthRequest(props)) {
    try {
      await handleOauthRequest(props)
    } catch (err) {
      logger.forBot().error((err as Error).message)
      return { status: 500, body: 'Error handling OAuth creation flow' }
    }
    return { status: 200 }
  }

  try {
    await validateBambooHrSignature(props)
  } catch (err) {
    logger.forBot().error((err as Error).message)
    return { status: 401, body: 'Invalid HMAC signature' }
  }

  // TODO: Implement event handling
  return { status: 200 }
}
