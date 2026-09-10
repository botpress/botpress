import { describe, expect, it, vi } from 'vitest'
import definition, {
  DEFAULT_HITL_ERROR_MESSAGE,
  DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE,
  DEFAULT_USER_INCOMPATIBLE_MSGTYPE_MESSAGE,
} from '../../../plugin.definition'
import { configureNewHitlSession } from '../../configuration'
import { handleMessage } from './all'
import type * as bp from '.botpress'

type Configuration = bp.configuration.Configuration
const arabic = {
  onUserIncompatibleMsgTypeMessage: 'عذراً، هذا النوع من الرسائل غير مدعوم. يرجى إعادة إرسال رسالتك كنص.',
  onUserHitlErrorMessage: 'حدث خطأ في الاتصال بخدمة العملاء. يرجى المحاولة مرة أخرى لاحقاً.',
}

const fixture = (overrides: Partial<Configuration> = {}) => {
  const messages: { conversationId: string; payload: { text?: string } }[] = []
  const active = new Map([
    ['up', { hitlActive: true }],
    ['down', { hitlActive: true }],
  ])
  const saved = new Map<string, Configuration>()
  const makeConversation = (id: string, integration: string, tags: Record<string, string>) => ({
    id,
    integration,
    tags,
    update: vi.fn(async (patch: { tags: Record<string, string> }) => {
      Object.assign(tags, patch.tags)
    }),
    createMessage: vi.fn(async (message: { payload: { text?: string } }) => {
      messages.push({ conversationId: id, payload: message.payload })
    }),
  })
  const up = makeConversation('up', 'webchat', { downstream: 'down' })
  const down = makeConversation('down', 'genesys-hitl', { upstream: 'up' })
  const user = { id: 'customer', tags: { downstream: 'down-user' } as Record<string, string> }
  const logger = { error: vi.fn(), info: vi.fn(), debug: vi.fn(), with: () => logger, withConversationId: () => logger }
  const client = { setState: vi.fn(async () => {}) }
  const stopHitl = vi.fn()
  const props = {
    ctx: { botId: 'bot' },
    configuration: { useHumanAgentInfo: false, flowOnHitlStopped: true, ...overrides },
    interfaces: { hitl: { integrationAlias: 'genesys-hitl' } },
    states: {
      conversation: {
        hitl: {
          getOrSet: async (id: string) => active.get(id),
          set: async (id: string, value: { hitlActive: boolean }) => {
            active.set(id, value)
          },
        },
        effectiveSessionConfig: {
          get: async (id: string) => {
            if (!saved.has(id)) throw Error('Missing state')
            return saved.get(id)
          },
          set: async (id: string, value: Configuration) => {
            saved.set(id, value)
          },
        },
      },
    },
    conversations: { hitl: { hitl: { getById: vi.fn(async ({ id }: { id: string }) => (id === 'up' ? up : down)) } } },
    users: { getById: vi.fn(async () => user) },
    actions: { hitl: { stopHitl } },
    logger,
    client,
  }
  const invoke = (conversationId = 'up', type = 'text') =>
    handleMessage({
      ...props,
      data: { id: 'message', conversationId, userId: 'customer', type, payload: { text: 'hello' } },
    } as unknown as bp.HookHandlerProps['before_incoming_message'])
  const configure = (configurationOverrides: Partial<Configuration>) =>
    configureNewHitlSession({
      states: props.states as unknown as bp.ActionHandlerProps['states'],
      configuration: props.configuration,
      configurationOverrides,
      upstreamConversationId: 'up',
    })
  return { props, messages, active, saved, up, down, user, invoke, configure, client, stopHitl }
}

describe('customer HITL error messages', () => {
  it('accepts the new optional settings without changing existing configuration defaults', () => {
    const schema = definition.configuration!.schema
    expect(schema.parse({})).toEqual({ useHumanAgentInfo: true, flowOnHitlStopped: true })
    expect(schema.parse(arabic)).toMatchObject(arabic)
    expect(schema.safeParse({ onUserHitlErrorMessage: 42 }).success).toBe(false)
    expect(
      definition.actions.startHitl.input.schema.parse({
        title: 'Fixture',
        userId: 'customer',
        conversationId: 'up',
        configurationOverrides: arabic,
      }).configurationOverrides
    ).toEqual(arabic)
    expect(definition.states.effectiveSessionConfig.schema.parse(arabic)).toMatchObject(arabic)
    expect(DEFAULT_USER_INCOMPATIBLE_MSGTYPE_MESSAGE).toBe(
      'Sorry, I can only handle one of the following message types: text, image, video, audio, file, bloc'
    )
    expect(DEFAULT_HITL_ERROR_MESSAGE).toBe('Something went wrong, you are not connected to a human agent...')
  })

  it.each([
    [undefined, DEFAULT_USER_INCOMPATIBLE_MSGTYPE_MESSAGE],
    ['', DEFAULT_USER_INCOMPATIBLE_MSGTYPE_MESSAGE],
    [arabic.onUserIncompatibleMsgTypeMessage, arabic.onUserIncompatibleMsgTypeMessage],
    ['NULL', undefined],
  ])('unsupported customer message with override %s preserves the active session', async (override, expected) => {
    const f = fixture({ onUserIncompatibleMsgTypeMessage: override })
    expect(await f.invoke('up', 'location')).toEqual({ stop: true })
    expect(f.messages).toEqual(expected ? [{ conversationId: 'up', payload: { type: 'text', text: expected } }] : [])
    expect(f.active.get('up')).toEqual({ hitlActive: true })
    expect(f.active.get('down')).toEqual({ hitlActive: true })
    expect(f.up.tags.humanAgentId).toBeUndefined()
    expect(f.stopHitl).not.toHaveBeenCalled()
  })

  describe.each(['conversation', 'user'] as const)('missing customer %s link', (link) => {
    it.each([
      [undefined, DEFAULT_HITL_ERROR_MESSAGE],
      ['', DEFAULT_HITL_ERROR_MESSAGE],
      [arabic.onUserHitlErrorMessage, arabic.onUserHitlErrorMessage],
      ['NULL', undefined],
    ])('override %s preserves local abort and does not forward the message', async (override, expected) => {
      const f = fixture({ onUserHitlErrorMessage: override })
      delete (link === 'conversation' ? f.up.tags : f.user.tags).downstream
      expect(await f.invoke()).toEqual({ stop: true })
      expect(f.messages).toEqual(expected ? [{ conversationId: 'up', payload: { type: 'text', text: expected } }] : [])
      expect(f.active.get('up')).toEqual({ hitlActive: false })
      expect(f.up.tags.hitlEndReason).toBe('internal-error')
      expect(f.up.tags.humanAgentId).toBeUndefined()
      expect(f.client.setState).toHaveBeenCalledWith(expect.objectContaining({ id: 'up', payload: { enabled: true } }))
      expect(f.stopHitl).not.toHaveBeenCalled()
      expect(f.down.createMessage).not.toHaveBeenCalled()
      expect(await f.invoke()).toEqual({ stop: false })
      expect(f.messages).toHaveLength(expected ? 1 : 0)
    })
  })

  it('uses saved per-session overrides and keeps existing sessions unchanged after a global update', async () => {
    const f = fixture({ onUserHitlErrorMessage: 'Global message' })
    await f.configure(arabic)
    f.props.configuration.onUserHitlErrorMessage = 'Changed global message'
    delete f.up.tags.downstream
    await f.invoke()
    expect(f.messages[0]?.payload.text).toBe(arabic.onUserHitlErrorMessage)
    expect(f.saved.get('up')).toMatchObject(arabic)
  })

  it('keeps English for old saved sessions that lack the new optional fields', async () => {
    const f = fixture()
    await f.configure({})
    Object.assign(f.props.configuration, arabic)
    await f.invoke('up', 'location')
    expect(f.messages[0]?.payload.text).toBe(DEFAULT_USER_INCOMPATIBLE_MSGTYPE_MESSAGE)
  })

  it('uses per-session suppression over the global customer warning', async () => {
    const f = fixture(arabic)
    await f.configure({ onUserIncompatibleMsgTypeMessage: 'NULL' })
    await f.invoke('up', 'location')
    expect(f.messages).toEqual([])
    expect(f.active.get('up')).toEqual({ hitlActive: true })
  })

  it('uses the global settings when saved session state cannot be read', async () => {
    const f = fixture(arabic)
    delete f.up.tags.downstream
    await f.invoke()
    expect(f.messages[0]?.payload.text).toBe(arabic.onUserHitlErrorMessage)
  })

  it('does not send customer overrides to an unbound downstream conversation', async () => {
    const f = fixture(arabic)
    delete f.down.tags.upstream
    await f.invoke('down')
    expect(f.messages).toEqual([
      { conversationId: 'down', payload: { type: 'text', text: DEFAULT_HITL_ERROR_MESSAGE } },
    ])
    expect(f.active.get('down')).toEqual({ hitlActive: false })
    expect(f.down.tags.hitlEndReason).toBe('internal-error')
  })

  it.each([undefined, 'Agent warning'])(
    'preserves the separate agent unsupported-message setting %s',
    async (agentMessage) => {
      const f = fixture({ ...arabic, onIncompatibleMsgTypeMessage: agentMessage })
      await f.invoke('down', 'location')
      expect(f.messages).toEqual([
        {
          conversationId: 'down',
          payload: { type: 'text', text: agentMessage ?? DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE },
        },
      ])
      expect(f.active.get('down')).toEqual({ hitlActive: true })
    }
  )

  it('continues forwarding supported customer text without an error notice', async () => {
    const f = fixture(arabic)
    expect(await f.invoke()).toEqual({ stop: true })
    expect(f.up.createMessage).not.toHaveBeenCalled()
    expect(f.down.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { type: 'text', text: 'hello', userId: 'down-user' } })
    )
    expect(f.active.get('up')).toEqual({ hitlActive: true })
  })

  it('deactivates the local session before attempting an error notice that fails to send', async () => {
    const f = fixture(arabic)
    delete f.up.tags.downstream
    f.up.createMessage.mockRejectedValueOnce(Error('Delivery failed'))
    await expect(f.invoke()).rejects.toThrow('Delivery failed')
    expect(f.active.get('up')).toEqual({ hitlActive: false })
    expect(f.up.tags.hitlEndReason).toBe('internal-error')
  })
})
