import { describe, it, expect, vi } from 'vitest'
import { validateRequestSignature } from './utils'
import * as crypto from 'crypto'

const generateSlackSignature = (secret: string, timestamp: string, body: any) => {
  const sigBasestring = `v0:${timestamp}:${body}`
  return 'v0=' + crypto.createHmac('sha256', secret).update(sigBasestring).digest('hex')
}

const mockedLogger = { forBot: () => ({ error: console.error }) } as any

vi.mock('.botpress', () => ({
  secrets: {
    SIGNING_SECRET: 'valid-signing-secret',
  },
}))

describe('validateRequestSignature', () => {
  it('validates a legitimate Slack request', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = {}
    const signature = generateSlackSignature('valid-signing-secret', timestamp, body)

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      },
      body,
    }

    expect(validateRequestSignature({ req: mockRequest as any, logger: mockedLogger })).toBe(true)
  })

  it('invalidates a 6 min old legitimate Slack request', () => {
    const timestamp = (Math.floor(Date.now() / 1000) - 60 * 6).toString()
    const body = {}
    const signature = generateSlackSignature('valid-signing-secret', timestamp, body)

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      },
      body,
    }

    expect(validateRequestSignature({ req: mockRequest as any, logger: mockedLogger })).toBe(false)
  })

  it('invalidates a request with an incorrect signature', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = {}
    const invalidSignature = generateSlackSignature('invalid-secret', timestamp, body)

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': invalidSignature,
      },
      body,
    }

    expect(validateRequestSignature({ req: mockRequest as any, logger: mockedLogger })).toBe(false)
  })

  it('with a signature of a different length', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = {}

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': '90f4j8032j04392jf043fj9f4230j2f4',
      },
      body,
    }

    expect(validateRequestSignature({ req: mockRequest as any, logger: mockedLogger })).toBe(false)
  })
})
