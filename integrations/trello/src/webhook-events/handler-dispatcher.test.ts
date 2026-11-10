import crypto from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatchIntegrationEvent } from './event-handlers'
import { handler } from './handler-dispatcher'
import * as bp from '.botpress'

vi.mock('./event-handlers', () => ({ dispatchIntegrationEvent: vi.fn() }))
vi.mock('./schemas', () => ({
  webhookEventPayloadSchema: { safeParse: (data: unknown) => ({ success: true, data }) },
  fallbackEventPayloadSchema: { safeParse: () => ({ success: false, error: new Error('unused') }) },
}))
vi.mock('definitions/events', () => ({ TrelloEventType: {} }))

const SECRET = 'trello-app-secret'
const CALLBACK_URL = 'https://webhook.botpress.cloud/wh_123'
const BODY = JSON.stringify({ action: { type: 'commentCard' }, webhook: {} })

const sign = (secret: string, body: string) =>
  crypto
    .createHmac('sha1', secret)
    .update(body + CALLBACK_URL)
    .digest('base64')

const buildProps = (opts: { secret?: string; signature?: string }) => {
  const error = vi.fn()
  const headers: Record<string, string> = opts.signature ? { 'x-trello-webhook': opts.signature } : {}
  const props = {
    req: { body: BODY, headers },
    ctx: { webhookId: 'wh_123', configuration: { trelloApiSecret: opts.secret } },
    logger: { forBot: () => ({ error }) },
  } as unknown as bp.HandlerProps
  return { props, error }
}

describe('webhook handler signature verification', () => {
  beforeEach(() => {
    vi.stubEnv('BP_API_URL', 'https://api.botpress.cloud')
    vi.mocked(dispatchIntegrationEvent).mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('dispatches a webhook signed with the configured secret', async () => {
    const { props, error } = buildProps({ secret: SECRET, signature: sign(SECRET, BODY) })

    await handler(props)

    expect(error).not.toHaveBeenCalled()
    expect(dispatchIntegrationEvent).toHaveBeenCalledOnce()
  })

  it.each([
    { case: 'a signature made with another secret', signature: sign('attacker-secret', BODY) },
    { case: 'no signature header', signature: undefined },
  ])('rejects a webhook with $case', async ({ signature }) => {
    const { props, error } = buildProps({ secret: SECRET, signature })

    await handler(props)

    expect(error).toHaveBeenCalledWith('The provided webhook payload failed its signature validation')
    expect(dispatchIntegrationEvent).not.toHaveBeenCalled()
  })

  it('skips verification when no secret is configured', async () => {
    const { props } = buildProps({ secret: undefined })

    await handler(props)

    expect(dispatchIntegrationEvent).toHaveBeenCalledOnce()
  })
})
