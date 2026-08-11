import { describe, it, vi } from 'vitest'
import * as bp from '.botpress'
import { handleMessage } from './all'

type HookProps = bp.HookHandlerProps['before_incoming_message']

const _makeProps = (conversation: { id: string; integration: string; tags: Record<string, string> }) => {
  const getById = vi.fn().mockResolvedValue(conversation)
  const getOrSet = vi.fn().mockResolvedValue({ hitlActive: false })
  return {
    data: { conversationId: conversation.id, id: 'msg_abc123', type: 'text', payload: { text: 'potato' } },
    conversations: { hitl: { hitl: { getById } } },
    states: { conversation: { hitl: { getOrSet } } },
    interfaces: { hitl: { integrationAlias: 'zendesk', actions: {}, events: {}, channels: {} } },
    alias: 'hitl',
    ctx: { botId: 'bot_abc123', configuration: { payload: '{}' } },
    logger: { info: vi.fn(), error: vi.fn(), withConversationId: vi.fn().mockReturnThis() },
  } as unknown as HookProps
}

describe.concurrent(handleMessage, () => {
  it('lets the bot handle a message from a conversation with no handoff tags and no active session', async ({
    expect,
  }) => {
    // Arrange
    const props = _makeProps({ id: 'conv_abc123', integration: 'webchat', tags: {} })

    // Act
    const result = await handleMessage(props)

    // Assert
    expect(result).toEqual({ stop: false })
  })

  it('stops propagation for an unlinked conversation owned by the backing integration', async ({ expect }) => {
    // Arrange: a downstream conversation whose linking crashed before the
    //          upstream tag was written must not be mistaken for an end-user
    //          conversation
    const props = _makeProps({ id: 'conv_ghi789', integration: 'zendesk', tags: {} })

    // Act
    const result = await handleMessage(props)

    // Assert
    expect(result).toEqual({ stop: true })
  })

  it('treats a conversation carrying an upstream tag as downstream regardless of its integration alias', async ({
    expect,
  }) => {
    // Arrange: the conversation belongs to an integration the bundle never
    //          compiled in, which is exactly the situation after a switch
    const props = _makeProps({ id: 'conv_def456', integration: 'desk', tags: { upstream: 'conv_abc123' } })

    // Act
    const result = await handleMessage(props)

    // Assert: inactive downstream sessions stop propagation, reached through
    //         the tag test instead of the alias test
    expect(result).toEqual({ stop: true })
  })
})
