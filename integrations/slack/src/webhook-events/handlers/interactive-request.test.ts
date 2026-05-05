import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getInteractiveThreadTs, handleInteractiveRequest } from './interactive-request'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(async () => ({})),
  },
}))

beforeEach(() => {
  vi.mocked(axios.post).mockClear()
})

const RESPONSE_URL = 'https://hooks.slack.com/actions/T000/B000/XXX'

type BlockActionsPayload = {
  type: string
  response_url?: string
  user: { id: string }
  channel?: { id: string }
  container?: {
    channel_id?: string
    message_ts?: string
    thread_ts?: string
  }
  message?: {
    ts?: string
    thread_ts?: string
  }
  actions?: { type: 'button'; value: string; action_id: string }[]
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

type ReplyLocation = 'channel' | 'thread' | 'channelAndThread'

const buildHandlerProps = (payload: BlockActionsPayload, opts: { replyLocation?: ReplyLocation } = {}) => {
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
      ctx: {
        configuration: {
          replyBehaviour: opts.replyLocation ? { location: opts.replyLocation, onlyOnBotMention: false } : undefined,
        },
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
    expect(getOrCreateConversation).toHaveBeenCalledTimes(1)
    expect(getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'thread-conversation-id',
        tags: expect.objectContaining({
          ts: '1764784399.000100',
          userId: 'U0A6E7PA7FH',
          channelId: 'C0123456789',
          forkedToThread: 'false',
        }),
      })
    )
  })

  it('keeps top-level block_actions messages on the existing channel conversation path', async () => {
    const payload = buildBlockActionsPayload({
      container: { channel_id: 'C0123456789', message_ts: '1764784399.000100' },
      message: { ts: '1764784399.000100' },
    })
    const { props, getOrCreateConversation, getOrCreateMessage } = buildHandlerProps(payload)

    await handleInteractiveRequest(props)

    expect(getOrCreateConversation).toHaveBeenCalledWith({
      channel: 'channel',
      tags: { id: 'C0123456789' },
    })
    expect(getOrCreateConversation).toHaveBeenCalledTimes(1)
    expect(getOrCreateMessage).toHaveBeenCalledTimes(1)
    expect(getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'channel-conversation-id',
        tags: expect.objectContaining({ forkedToThread: 'false' }),
      })
    )
  })

  it('forks a top-level click into a thread when replyBehaviour.location is "thread"', async () => {
    const payload = buildBlockActionsPayload({
      container: { channel_id: 'C0123456789', message_ts: '1764784399.000100' },
      message: { ts: '1764784399.000100' },
    })
    const { props, getOrCreateConversation, getOrCreateMessage } = buildHandlerProps(payload, {
      replyLocation: 'thread',
    })

    await handleInteractiveRequest(props)

    expect(getOrCreateConversation).toHaveBeenCalledTimes(1)
    expect(getOrCreateConversation).toHaveBeenCalledWith({
      channel: 'thread',
      tags: { id: 'C0123456789', thread: '1764784399.000100' },
      discriminateByTags: ['id', 'thread'],
    })
    expect(getOrCreateMessage).toHaveBeenCalledTimes(1)
    expect(getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'thread-conversation-id',
        tags: expect.objectContaining({ forkedToThread: 'true' }),
      })
    )
  })

  it('dispatches a top-level click to BOTH the channel and the thread when replyBehaviour.location is "channelAndThread"', async () => {
    const payload = buildBlockActionsPayload({
      container: { channel_id: 'C0123456789', message_ts: '1764784399.000100' },
      message: { ts: '1764784399.000100' },
    })
    const { props, getOrCreateConversation, getOrCreateMessage } = buildHandlerProps(payload, {
      replyLocation: 'channelAndThread',
    })

    await handleInteractiveRequest(props)

    expect(getOrCreateConversation).toHaveBeenCalledTimes(2)
    expect(getOrCreateConversation).toHaveBeenNthCalledWith(1, {
      channel: 'channel',
      tags: { id: 'C0123456789' },
    })
    expect(getOrCreateConversation).toHaveBeenNthCalledWith(2, {
      channel: 'thread',
      tags: { id: 'C0123456789', thread: '1764784399.000100' },
      discriminateByTags: ['id', 'thread'],
    })
    expect(getOrCreateMessage).toHaveBeenCalledTimes(2)
    expect(getOrCreateMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        conversationId: 'channel-conversation-id',
        tags: expect.objectContaining({ forkedToThread: 'false' }),
      })
    )
    expect(getOrCreateMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        conversationId: 'thread-conversation-id',
        tags: expect.objectContaining({ forkedToThread: 'true' }),
      })
    )
  })

  it('keeps thread-click responses in the thread when replyBehaviour.location is "channel"', async () => {
    const payload = buildBlockActionsPayload()
    const { props, getOrCreateConversation, getOrCreateMessage } = buildHandlerProps(payload, {
      replyLocation: 'channel',
    })

    await handleInteractiveRequest(props)

    expect(getOrCreateConversation).toHaveBeenCalledTimes(1)
    expect(getOrCreateConversation).toHaveBeenCalledWith({
      channel: 'thread',
      tags: { id: 'C0123456789', thread: '1764784200.000200' },
      discriminateByTags: ['id', 'thread'],
    })
    expect(getOrCreateMessage).toHaveBeenCalledTimes(1)
    expect(getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'thread-conversation-id',
        tags: expect.objectContaining({ forkedToThread: 'false' }),
      })
    )
  })

  it('short-circuits non-block_actions interaction types without responding or persisting a message', async () => {
    const payload = buildBlockActionsPayload({ type: 'view_submission' })
    const { props, getOrCreateConversation, getOrCreateMessage } = buildHandlerProps(payload)

    await handleInteractiveRequest(props)

    expect(axios.post).not.toHaveBeenCalled()
    expect(getOrCreateConversation).not.toHaveBeenCalled()
    expect(getOrCreateMessage).not.toHaveBeenCalled()
  })

  it('throws when the actions field is omitted from a block_actions payload', async () => {
    const payload = buildBlockActionsPayload({ actions: undefined })
    const { props } = buildHandlerProps(payload)

    await expect(handleInteractiveRequest(props)).rejects.toThrow(/no action/i)
  })

  it('throws when response_url is missing from a block_actions payload', async () => {
    const payload: BlockActionsPayload = {
      type: 'block_actions',
      user: { id: 'U0A6E7PA7FH' },
      channel: { id: 'C0123456789' },
      message: { ts: '1764784399.000100' },
      actions: [{ type: 'button', value: 'approve', action_id: 'quick_reply_0' }],
    }
    const { props } = buildHandlerProps(payload)

    await expect(handleInteractiveRequest(props)).rejects.toThrow(/response url/i)
  })

  it('throws when no slack channel id can be resolved from the payload', async () => {
    const payload: BlockActionsPayload = {
      type: 'block_actions',
      response_url: RESPONSE_URL,
      user: { id: 'U0A6E7PA7FH' },
      message: { ts: '1764784399.000100' },
      actions: [{ type: 'button', value: 'approve', action_id: 'quick_reply_0' }],
    }
    const { props } = buildHandlerProps(payload)

    await expect(handleInteractiveRequest(props)).rejects.toThrow(/channel id/i)
  })

  it('throws when no slack message timestamp can be resolved from the payload', async () => {
    const payload: BlockActionsPayload = {
      type: 'block_actions',
      response_url: RESPONSE_URL,
      user: { id: 'U0A6E7PA7FH' },
      channel: { id: 'C0123456789' },
      actions: [{ type: 'button', value: 'approve', action_id: 'quick_reply_0' }],
    }
    const { props } = buildHandlerProps(payload)

    await expect(handleInteractiveRequest(props)).rejects.toThrow(/message timestamp/i)
  })

  it('parses raw JSON bodies received via /interactive without stripping payload= substrings inside values', async () => {
    const payload = buildBlockActionsPayload({
      actions: [{ type: 'button', value: 'redirect=payload=baz', action_id: 'quick_reply_0' }],
    })
    const { props, getOrCreateMessage } = buildHandlerProps(payload)
    props.req.body = JSON.stringify(payload)

    await handleInteractiveRequest(props)

    expect(axios.post).toHaveBeenCalledWith(RESPONSE_URL, { text: 'redirect=payload=baz' })
    expect(getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { text: 'redirect=payload=baz' },
      })
    )
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
