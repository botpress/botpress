import { describe, it, expect, vi } from 'vitest'

import { getClient, getZai } from './utils'

import { Client } from '@botpress/client'

describe('zai retry', { timeout: 60_000 }, () => {
  const client = getClient()
  let zai = getZai().with({ retry: { maxRetries: 3 } })

  it('retries 3 times and succeeds', async () => {
    let retryCount = 0
    const throwingClient = {
      ...client,
      callAction: vi.fn((input) => {
        if (++retryCount < 3) {
          throw new Error('Failed to call model')
        }
        return client.callAction(input)
      }),
    } as unknown as Client

    const value = await zai
      .with({ client: throwingClient })
      .check('This text is very clearly written in English.', 'is an english sentence')

    expect(value).toBe(true)
    expect(retryCount).toBe(3)
  })

  it('retries 0 times when success', async () => {
    const fn = vi.fn((input) => client.callAction(input))

    const throwingClient = {
      ...client,
      callAction: fn,
    } as unknown as Client

    const value = await zai
      .with({ client: throwingClient })
      .check('This text is very clearly written in English.', 'is an english sentence')

    expect(value).toBe(true)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('fails when exceeded max', async () => {
    const fn = vi.fn(() => {
      throw new Error('Failed to call model')
    })

    const throwingClient = {
      ...client,
      callAction: fn,
    } as unknown as Client

    const value = zai
      .with({ client: throwingClient, retry: { maxRetries: 1 } })
      .check('This text is very clearly written in English.', 'is an english sentence')

    await expect(value).rejects.toThrowError(/retries/)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
