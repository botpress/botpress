import { describe, it, vi } from 'vitest'
import { handleEvent as handleHitlAssigned } from './hitl-assigned'
import { handleEvent as handleHitlStopped } from './hitl-stopped'

type StopHandlerProps = Parameters<typeof handleHitlStopped>[0]
type AssignHandlerProps = Parameters<typeof handleHitlAssigned>[0]

type MockConversation = {
  id: string
  integration: string
  tags: Record<string, string>
  createMessage: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const _makeMocks = (options: { upstreamPointsBackToDownstream: boolean }) => {
  const downstreamConversation: MockConversation = {
    id: 'conv_def456',
    integration: 'desk',
    tags: { upstream: 'conv_abc123' },
    createMessage: vi.fn(),
    update: vi.fn(),
  }
  const upstreamConversation: MockConversation = {
    id: 'conv_abc123',
    integration: 'telegram',
    tags: { downstream: options.upstreamPointsBackToDownstream ? 'conv_def456' : 'conv_ghi789' },
    createMessage: vi.fn(),
    update: vi.fn(),
  }
  const getById = vi.fn(async ({ id }: { id: string }) =>
    id === downstreamConversation.id ? downstreamConversation : upstreamConversation
  )
  const setHitlState = vi.fn()
  const getOrSetHitlState = vi.fn().mockResolvedValue({ hitlActive: true })
  const props = {
    data: { payload: { conversationId: 'conv_def456', userId: 'user_abc123' } },
    conversations: { hitl: { hitl: { getById } } },
    states: {
      conversation: {
        hitl: { getOrSet: getOrSetHitlState, set: setHitlState },
        effectiveSessionConfig: { get: vi.fn().mockRejectedValue(new Error('no session config')) },
      },
    },
    users: { getById: vi.fn().mockResolvedValue({ id: 'user_abc123', name: 'A Human Agent', tags: {} }) },
    client: { setState: vi.fn() },
    configuration: {},
    ctx: { botId: 'bot_abc123', configuration: { payload: '{}' } },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      withConversationId: vi.fn().mockReturnThis(),
      withUserId: vi.fn().mockReturnThis(),
    },
  } as unknown as StopHandlerProps & AssignHandlerProps
  return { props, downstreamConversation, upstreamConversation, setHitlState, getOrSetHitlState }
}

describe.concurrent('hitlStopped handler', () => {
  it('stops without side effects when the upstream conversation points to another downstream conversation', async ({
    expect,
  }) => {
    // Arrange
    const { props, downstreamConversation, upstreamConversation, setHitlState } = _makeMocks({
      upstreamPointsBackToDownstream: false,
    })

    // Act
    const result = await handleHitlStopped(props)

    // Assert
    expect(result).toEqual({ stop: true })
    expect(upstreamConversation.createMessage).not.toHaveBeenCalled()
    expect(setHitlState).not.toHaveBeenCalled()
    expect(downstreamConversation.update).not.toHaveBeenCalled()
    expect(upstreamConversation.update).not.toHaveBeenCalled()
  })

  it('ends the session when the upstream conversation points back to the stopped conversation', async ({ expect }) => {
    // Arrange
    const { props, upstreamConversation, setHitlState } = _makeMocks({ upstreamPointsBackToDownstream: true })

    // Act
    const result = await handleHitlStopped(props)

    // Assert
    expect(result).toEqual({ stop: true })
    expect(upstreamConversation.createMessage).toHaveBeenCalled()
    expect(setHitlState).toHaveBeenCalledWith('conv_def456', { hitlActive: false })
    expect(setHitlState).toHaveBeenCalledWith('conv_abc123', { hitlActive: false })
  })
})

describe.concurrent('events for conversations that were never linked', () => {
  it('lets the bot handle a stop event for a conversation that was never linked', async ({ expect }) => {
    // Arrange: an inactive conversation with no upstream tag belongs to
    //          another integration, not to this plugin
    const { props, downstreamConversation, getOrSetHitlState } = _makeMocks({
      upstreamPointsBackToDownstream: true,
    })
    downstreamConversation.tags = {}
    getOrSetHitlState.mockResolvedValue({ hitlActive: false })

    // Act
    const result = await handleHitlStopped(props)

    // Assert
    expect(result).toBeUndefined()
  })
})

describe.concurrent('hitlAssigned handler', () => {
  it('stops without side effects when the upstream conversation points to another downstream conversation', async ({
    expect,
  }) => {
    // Arrange
    const { props, downstreamConversation, upstreamConversation } = _makeMocks({
      upstreamPointsBackToDownstream: false,
    })

    // Act
    const result = await handleHitlAssigned(props)

    // Assert
    expect(result).toEqual({ stop: true })
    expect(downstreamConversation.update).not.toHaveBeenCalled()
    expect(upstreamConversation.update).not.toHaveBeenCalled()
    expect(upstreamConversation.createMessage).not.toHaveBeenCalled()
  })

  it('assigns the agent when the upstream conversation points back to the conversation', async ({ expect }) => {
    // Arrange
    const { props, downstreamConversation, upstreamConversation } = _makeMocks({
      upstreamPointsBackToDownstream: true,
    })

    // Act
    const result = await handleHitlAssigned(props)

    // Assert
    expect(result).toEqual({ stop: true })
    expect(downstreamConversation.update).toHaveBeenCalledWith({
      tags: { humanAgentId: 'user_abc123', humanAgentName: 'A Human Agent' },
    })
    expect(upstreamConversation.update).toHaveBeenCalledWith({
      tags: { humanAgentId: 'user_abc123', humanAgentName: 'A Human Agent' },
    })
    expect(upstreamConversation.createMessage).toHaveBeenCalled()
  })
})
