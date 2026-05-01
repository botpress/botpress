import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifies the HMAC signature on Shopify's OAuth callback query string.
 *
 * Shopify signs the callback query params with the app's client secret. The `hmac` (and legacy
 * `signature`) parameter must be removed, the remaining params sorted alphabetically by key,
 * URL-encoded, and joined as `key=value&key=value`. The HMAC-SHA256 of that string (hex) must
 * match the received `hmac` value.
 *
 * See https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
 */
export const verifyOAuthCallbackHmac = (query: URLSearchParams, secret: string): boolean => {
  const receivedHmac = query.get('hmac')
  if (!receivedHmac) {
    return false
  }

  const entries: [string, string][] = []
  for (const [key, value] of query.entries()) {
    if (key === 'hmac' || key === 'signature') {
      continue
    }
    entries.push([key, value])
  }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  const message = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  const computed = createHmac('sha256', secret).update(message).digest()
  const received = Buffer.from(receivedHmac, 'hex')

  return computed.length === received.length && timingSafeEqual(computed, received)
}

/**
 * Verifies the HMAC signature on an incoming Shopify webhook request.
 *
 * Shopify sends the HMAC-SHA256 of the raw request body (base64-encoded) in the
 * `X-Shopify-Hmac-Sha256` header. The HMAC is computed with the app's client secret.
 *
 * See https://shopify.dev/docs/apps/build/webhooks/subscribe#verify-a-webhook
 */
export const verifyWebhookHmac = (rawBody: string, hmacHeader: string, secret: string): boolean => {
  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
  const received = Buffer.from(hmacHeader, 'base64')

  return computed.length === received.length && timingSafeEqual(computed, received)
}
