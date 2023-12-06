import { IntegrationContext, Request } from '@botpress/sdk'
import jwt from 'jsonwebtoken'
import * as bp from '.botpress'

type IntegrationLogger = Parameters<bp.IntegrationProps['handler']>[0]['logger']

const EXPECTED_ISSUER = 'https://accounts.google.com'

export const validateRequestSignature = ({
  req,
  logger,
  ctx,
}: {
  req: Request
  logger: IntegrationLogger
  ctx: IntegrationContext<bp.configuration.Configuration>
}) => {
  try {
    const jwtToken = req.headers['x-goog-channel-token'] as string

    const decoded = jwt.verify(jwtToken, bp.secrets.GOOGLE_PUBLIC_KEY) as any

    if (decoded.iss !== EXPECTED_ISSUER || decoded.aud !== ctx.configuration.clientId) {
      logger.forBot().error('Request signature verification failed: invalid issuer or audience in JWT')
      return false
    }
    return true
  } catch (error) {
    logger.forBot().error('Request signature verification failed')
    return false
  }
}
