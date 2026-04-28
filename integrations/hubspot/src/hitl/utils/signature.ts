import * as crypto from 'crypto'
import * as bp from '.botpress'

/**
 * Validates the HubSpot webhook signature v3 (HMAC-SHA256).
 * Used for Custom Channel webhook events.
 */
export function validateHubSpotSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  method: string,
  webhookUrl: string,
  clientSecret: string,
  logger: bp.Logger
): boolean {
  if (!signature || !clientSecret || !timestamp) {
    logger.forBot().error('Missing required headers or client secret for HubSpot signature validation')
    return false
  }

  const MAX_ALLOWED_TIMESTAMP_MS = 300000 // 5 minutes
  const timestampDiff = Date.now() - parseInt(timestamp)
  if (timestampDiff > MAX_ALLOWED_TIMESTAMP_MS) {
    logger.forBot().error(`HubSpot webhook timestamp too old: ${timestampDiff}ms`)
    return false
  }

  const rawString = `${method}${webhookUrl}${requestBody}${timestamp}`
  const hmac = crypto.createHmac('sha256', clientSecret)
  hmac.update(rawString)
  const computedSignature = hmac.digest('base64')

  try {
    const isValid = crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature))
    if (!isValid) {
      logger.forBot().error('Invalid HubSpot webhook signature v3')
    }
    return isValid
  } catch {
    logger.forBot().error('HubSpot signature comparison failed (length mismatch)')
    return false
  }
}
