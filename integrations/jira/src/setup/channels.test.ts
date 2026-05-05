import { RuntimeError } from '@botpress/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addCommentToIssue: vi.fn(),
  getClient: vi.fn(),
}))

vi.mock('../utils', () => ({
  getClient: mocks.getClient,
}))

import { channels } from './channels'

describe('issueComments channel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.addCommentToIssue.mockResolvedValue('10042')
    mocks.getClient.mockReturnValue({
      addCommentToIssue: mocks.addCommentToIssue,
    })
  })

  it('posts text messages as Jira issue comments', async () => {
    const ack = vi.fn()

    await channels.issueComments.messages.text({
      ctx: {
        configuration: {
          host: 'https://example.atlassian.net',
          email: 'user@example.com',
          apiToken: 'token',
        },
      },
      payload: { text: 'Please investigate this.' },
      conversation: { id: 'conv-1', tags: { issueKey: 'SCRUM-17' } },
      ack,
      logger: { forBot: () => ({ info: vi.fn(), debug: vi.fn() }) },
    } as any)

    expect(mocks.addCommentToIssue).toHaveBeenCalledWith('SCRUM-17', 'Please investigate this.')
    expect(ack).toHaveBeenCalledWith({ tags: { commentId: '10042' } })
  })

  it('requires the conversation issue key tag', async () => {
    await expect(
      channels.issueComments.messages.text({
        ctx: {
          configuration: {
            host: 'https://example.atlassian.net',
            email: 'user@example.com',
            apiToken: 'token',
          },
        },
        payload: { text: 'Missing destination.' },
        conversation: { id: 'conv-1', tags: {} },
        ack: vi.fn(),
        logger: { forBot: () => ({ info: vi.fn(), debug: vi.fn() }) },
      } as any)
    ).rejects.toThrow(RuntimeError)
  })
})
