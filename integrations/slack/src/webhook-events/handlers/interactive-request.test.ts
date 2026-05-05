import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { getInteractiveThreadTs, handleInteractiveRequest } from './interactive-request'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(async () => ({})),
  },
}))

const RESPONSE_URL = 'https://hooks.slack.com/actions/T000/B000/XXX'

type BlockActionsPayload = {
  type: 'block_actions'
  response_url: string
  user: { id: string }
  channel: { id: string }
  container?: {
    channel_id?: string
    message_ts?: string
    thread_ts?: string
  }
  message: {
    ts: string
    thread_ts?: string
  }
  actions: { type: 'button'; value: string; action_id: string }[]
}

type GetOrCreateConversationInput = {
  channel: string
  tags: Record<string, string | undefined>
  discriminateByTags?: string[]
}

type GetOrCreateMessageInput = {
  tags: Record<string, string | undefined>
  type: string
  payload: { text: string }
  userId: string
  conversationId: string
}

const buildBlockActionsPayload = (overrides: Partial<BlockActionsPayload> = {}): BlockActionsPayload => ({
  type: 'block_actions',
  response_url: RESPONSE_URL,
  user: { id: 'U0A6E7PA7FH' },
  channel: { id: 'C0123456789' },
  container: {
    channel_id: 'C0123456789',
    message_ts: '1764784399.000100',
    thread_ts: '1764784200.000200',
  },
  message: {
    ts: '1764784399.000100',
    thread_ts: '1764784200.000200',
  },
  actions: [{ type: 'button', value: 'approve', action_id: 'quick_reply_0' }],
  ...overrides,
})

const encodePayload = (payload: BlockActionsPayload): string => `payload=${encodeURIComponent(JSON.stringify(payload))}`

const buildHandlerProps = (payload: BlockActionsPayload) => {
  const getOrCreateConversation = vi.fn(async (input: GetOrCreateConversationInput) => ({
    conversation: { id: input.channel === 'thread' ? 'thread-conversation-id' : 'channel-conversation-id' },
  }))
  const getOrCreateMessage = vi.fn(async (input: GetOrCreateMessageInput) => ({
    message: { id: 'message-id', ...input },
  }))

  return {
    props: {
      req: {
        body: encodePayload(payload),
        path: '/interactive',
      },
      client: {
        getOrCreateUser: vi.fn(async () => ({ user: { id: 'botpress-user-id' } })),
        getOrCreateConversation,
        getOrCreateMessage,
      },
      logger: {
        forBot: () => ({
          debug: vi.fn(),
          error: vi.fn(),
        }),
      },
    } as unknown as Parameters<typeof handleInteractiveRequest>[0],
    getOrCreateConversation,
    getOrCreateMessage,
  }
}

describe('handleInteractiveRequest', () => {
  it('routes block_actions messages to the Slack thread conversation when container.thread_ts is present', async () => {
    const payload = buildBlockActionsPayload()
    const { props, getOrCreateConversation, getOrCreateMessage } = buildHandlerProps(payload)

    await handleInteractiveRequest(props)

    expect(axios.post).toHaveBeenCalledWith(RESPONSE_URL, { text: 'approve' })
    expect(getOrCreateConversation).toHaveBeenCalledWith({
      channel: 'thread',
      tags: { id: 'C0123456789', thread: '1764784200.000200' },
      discriminateByTags: ['id', 'thread'],
    })
    expect(getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'thread-conversation-id',
        tags: {
          ts: '1764784399.000100',
          userId: 'U0A6E7PA7FH',
          channelId: 'C0123456789',
        },
      })
    )
  })

  it('keeps top-level block_actions messages on the existing channel conversation path', async () => {
    const payload = buildBlockActionsPayload({
      container: { channel_id: 'C0123456789', message_ts: '1764784399.000100' },
      message: { ts: '1764784399.000100' },
    })
    const { props, getOrCreateConversation } = buildHandlerProps(payload)

    await handleInteractiveRequest(props)

    expect(getOrCreateConversation).toHaveBeenCalledWith({
      channel: 'channel',
      tags: { id: 'C0123456789' },
    })
  })
})

describe('getInteractiveThreadTs', () => {
  it('prefers container.thread_ts over message.thread_ts for interactive payloads', () => {
    expect(
      getInteractiveThreadTs({
        container: { thread_ts: '1764784200.000200' },
        message: { thread_ts: '1764784000.000300' },
      })
    ).toBe('1764784200.000200')
  })

  it('extracts message.thread_ts for view_submission and message_action style payloads without a container thread', () => {
    expect(getInteractiveThreadTs({ message: { thread_ts: '1764784200.000200' } })).toBe('1764784200.000200')
  })
})
