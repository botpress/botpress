import { describe, it, expect } from 'vitest'
import * as crypto from 'crypto'
import { SlackEventSignatureValidator } from './utils'

const VALID_SIGNING_SECRET = 'valid-signing-secret'
const INVALID_SIGNING_SECRET = 'invalid-signing-secret'

const mockedLogger = { forBot: () => ({ error: console.error }) } as any

const generateSlackSignature = (secret: string, timestamp: string, body: any) => {
  const sigBasestring = `v0:${timestamp}:${body}`
  return 'v0=' + crypto.createHmac('sha256', secret).update(sigBasestring).digest('hex')
}

describe('SlackEventSignatureValidator', () => {
  it('validates a legitimate Slack request', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = {}
    const signature = generateSlackSignature(VALID_SIGNING_SECRET, timestamp, body)

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      },
      body,
    }

    expect(
      new SlackEventSignatureValidator(
        VALID_SIGNING_SECRET,
        mockRequest as any,
        mockedLogger
      ).isEventProperlyAuthenticated()
    ).toBe(true)
  })

  it('invalidates a 6 min old legitimate Slack request', () => {
    const timestamp = (Math.floor(Date.now() / 1000) - 60 * 6).toString()
    const body = {}
    const signature = generateSlackSignature(VALID_SIGNING_SECRET, timestamp, body)

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      },
      body,
    }

    expect(
      new SlackEventSignatureValidator(
        VALID_SIGNING_SECRET,
        mockRequest as any,
        mockedLogger
      ).isEventProperlyAuthenticated()
    ).toBe(false)
  })

  it('invalidates a request with an incorrect signature', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = {}
    const invalidSignature = generateSlackSignature(INVALID_SIGNING_SECRET, timestamp, body)

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': invalidSignature,
      },
      body,
    }

    expect(
      new SlackEventSignatureValidator(
        VALID_SIGNING_SECRET,
        mockRequest as any,
        mockedLogger
      ).isEventProperlyAuthenticated()
    ).toBe(false)
  })

  it('invalidates a request with a signature of a different length', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = {}

    const mockRequest = {
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': '90f4j8032j04392jf043fj9f4230j2f4',
      },
      body,
    }

    expect(
      new SlackEventSignatureValidator(
        VALID_SIGNING_SECRET,
        mockRequest as any,
        mockedLogger
      ).isEventProperlyAuthenticated()
    ).toBe(false)
  })
})
