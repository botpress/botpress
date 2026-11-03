import { Activity } from 'botbuilder'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { processInboundChannelMessage } from './inbound'
import * as bp from '.botpress'

const getMember = vi.fn()

vi.mock('botbuilder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('botbuilder')>()
  return { ...actual, TeamsInfo: { getMember: (...args: unknown[]) => getMember(...args) } }
})

vi.mock('../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils')>()
  return {
    ...actual,
    getAdapter: () => ({
      continueConversation: async (_ref: unknown, logic: (tc: unknown) => Promise<void>) => logic({}),
    }),
  }
})

const activity = {
  type: 'message',
  id: 'activity-1',
  text: 'hello',
  locale: 'en-US',
  from: { id: 'teams-user-1', name: 'Jane Doe' },
  recipient: { id: 'bot-1', name: 'Bot' },
  conversation: { id: 'teams-conversation-1' },
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/emea/',
} as Activity

const makeProps = (configuration: Partial<bp.configuration.Configuration>) => {
  const client = {
    getOrCreateConversation: vi.fn(async () => ({ conversation: { id: 'conversation-1' } })),
    setState: vi.fn(async () => ({})),
    getOrCreateUser: vi.fn(async () => ({ user: { id: 'user-1' } })),
    getOrCreateMessage: vi.fn(async () => ({ message: { id: 'message-1' } })),
  }
  const info = vi.fn()
  const warn = vi.fn()
  const logger = { forBot: () => ({ info, warn, error: vi.fn(), debug: vi.fn() }) }
  const props = {
    client,
    logger,
    ctx: { configuration: { appId: 'app-id', appPassword: 'app-password', ...configuration } },
  } as unknown as bp.HandlerProps
  return { client, info, warn, props }
}

describe('processInboundChannelMessage', () => {
  beforeEach(() => {
    getMember.mockReset()
    getMember.mockResolvedValue({ id: 'teams-user-1', email: 'jane.doe@example.com' })
  })

  test.each([
    ['has no stored value (installs saved before the option existed)', {}],
    ['true', { collectUserEmail: true }],
  ])('stores the sender email as a user tag when collectUserEmail %s', async (_, configuration) => {
    const { client, info, props } = makeProps(configuration)

    await processInboundChannelMessage(props, activity)

    expect(getMember).toHaveBeenCalledOnce()
    expect(client.getOrCreateUser).toHaveBeenCalledWith({
      tags: { id: 'teams-user-1', email: 'jane.doe@example.com' },
    })
    expect(info).toHaveBeenCalledWith('Received request from user: jane.doe@example.com')
  })

  test('does not look up, log or store the sender email when collectUserEmail is false', async () => {
    const { client, info, props } = makeProps({ collectUserEmail: false })

    await processInboundChannelMessage(props, activity)

    expect(getMember).not.toHaveBeenCalled()
    expect(client.getOrCreateUser).toHaveBeenCalledWith({
      tags: { id: 'teams-user-1' },
      discriminateByTags: ['id'],
    })
    expect(info).not.toHaveBeenCalled()
    expect(client.getOrCreateMessage).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', conversationId: 'conversation-1', payload: { text: 'hello' } })
    )
  })

  test('handles the message without an email when the email lookup fails', async () => {
    getMember.mockRejectedValue(new Error('Forbidden'))
    const { client, info, warn, props } = makeProps({})

    await processInboundChannelMessage(props, activity)

    expect(warn).toHaveBeenCalledWith("Could not look up the sender's email: Forbidden")
    expect(info).not.toHaveBeenCalled()
    expect(client.getOrCreateUser).toHaveBeenCalledWith({ tags: { id: 'teams-user-1', email: undefined } })
    expect(client.getOrCreateMessage).toHaveBeenCalledOnce()
  })
})
