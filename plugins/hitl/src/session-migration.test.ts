import { describe, it, vi } from 'vitest'
import { tryMigrateSession } from './session-migration'
import type * as types from './types'

type MigrationProps = Parameters<typeof tryMigrateSession>[0]['props']

const asConversation = (mock: object) => mock as types.ActionableConversation

const _makeFixture = (opts: { startHitlFails?: boolean } = {}) => {
  const calls: string[] = []
  const newDownstreamConversation = {
    id: 'conv_new456',
    integration: 'desk',
    tags: {},
    update: vi.fn().mockImplementation(async () => calls.push('link-new')),
  }
  const callAction = vi.fn().mockImplementation(async ({ type }: { type: string }) => {
    calls.push(type)
    if (type === 'desk:startHitl' && opts.startHitlFails) {
      throw new Error('potato outage')
    }
    return { output: { conversationId: 'conv_new456', userId: 'user_def456' } }
  })
  const createMessage = vi.fn().mockImplementation(async ({ conversationId }: { conversationId: string }) => {
    calls.push(`message:${conversationId}`)
    return { message: { id: 'msg_abc123' } }
  })
  const upstreamConversation = {
    id: 'conv_up123',
    integration: 'webchat',
    tags: { downstream: 'conv_old789' },
    update: vi.fn().mockImplementation(async () => calls.push('link-upstream')),
    listMessages: () => ({ takePage: async () => [] }),
    createMessage: vi.fn().mockImplementation(async () => calls.push('message:conv_up123')),
  }
  const oldDownstreamConversation = {
    id: 'conv_old789',
    integration: 'zendesk',
    tags: { upstream: 'conv_up123' },
    update: vi.fn().mockResolvedValue(undefined),
    createMessage: vi.fn().mockImplementation(async () => calls.push('message:conv_old789')),
  }
  const getById = vi.fn().mockImplementation(async ({ id }: { id: string }) => {
    if (id === 'conv_new456') return newDownstreamConversation
    if (id === 'conv_old789') return oldDownstreamConversation
    return upstreamConversation
  })
  const getOrSet = vi.fn().mockResolvedValue({ hitlActive: true })
  const set = vi.fn().mockResolvedValue(undefined)
  const hookProps = {
    data: { userId: 'user_up1' },
    client: { callAction, createMessage, setState: vi.fn().mockResolvedValue(undefined) },
    conversations: { hitl: { hitl: { getById } } },
    users: {
      getById: vi.fn().mockResolvedValue({
        id: 'user_up1',
        tags: { integrationAlias: 'desk', downstream: 'user_def456' },
      }),
    },
    states: {
      conversation: { hitl: { getOrSet, set }, effectiveSessionConfig: { get: vi.fn().mockResolvedValue({}) } },
    },
    interfaces: { hitl: { integrationAlias: 'zendesk', name: 'zendesk', actions: {}, events: {}, channels: {} } },
    ctx: { botId: 'bot_abc123', configuration: { payload: '{}' } },
    logger: { info: vi.fn(), error: vi.fn(), withConversationId: vi.fn().mockReturnThis() },
  } as unknown as MigrationProps
  return { hookProps, calls, upstreamConversation, oldDownstreamConversation, newDownstreamConversation }
}

const DESK_BACKING_INTEGRATION = { alias: 'desk' }

describe.concurrent(tryMigrateSession, () => {
  it('opens the new session before closing the old downstream conversation', async ({ expect }) => {
    // Arrange
    const { hookProps, calls, upstreamConversation, oldDownstreamConversation } = _makeFixture()

    // Act
    const result = await tryMigrateSession({
      props: hookProps,
      upstreamConversation: asConversation(upstreamConversation),
      downstreamConversation: asConversation(oldDownstreamConversation),
      backingIntegration: DESK_BACKING_INTEGRATION,
      sessionConfig: {},
    })

    // Assert
    expect(result.migrated).toBe(true)
    const openIndex = calls.indexOf('desk:startHitl')
    const closeIndex = calls.indexOf('zendesk:stopHitl')
    expect(openIndex).toBeGreaterThanOrEqual(0)
    expect(closeIndex).toBeGreaterThan(openIndex)
  })

  it('closes the just-created downstream conversation when re-linking the upstream conversation fails', async ({
    expect,
  }) => {
    // Arrange
    const { hookProps, calls, upstreamConversation, oldDownstreamConversation } = _makeFixture()
    upstreamConversation.update.mockRejectedValue(new Error('potato outage'))

    // Act
    const result = await tryMigrateSession({
      props: hookProps,
      upstreamConversation: asConversation(upstreamConversation),
      downstreamConversation: asConversation(oldDownstreamConversation),
      backingIntegration: DESK_BACKING_INTEGRATION,
      sessionConfig: {},
    })

    // Assert
    expect(result.migrated).toBe(false)
    expect(calls).toContain('desk:stopHitl')
    expect(calls).not.toContain('zendesk:stopHitl')
  })

  it('leaves the upstream conversation on the old downstream conversation when linking the new one fails', async ({
    expect,
  }) => {
    // Arrange
    const { hookProps, calls, upstreamConversation, oldDownstreamConversation, newDownstreamConversation } =
      _makeFixture()
    newDownstreamConversation.update.mockRejectedValue(new Error('potato outage'))

    // Act
    const result = await tryMigrateSession({
      props: hookProps,
      upstreamConversation: asConversation(upstreamConversation),
      downstreamConversation: asConversation(oldDownstreamConversation),
      backingIntegration: DESK_BACKING_INTEGRATION,
      sessionConfig: {},
    })

    // Assert: the upstream conversation was never re-linked, so the session
    //         fully survives on the old downstream conversation
    expect(result.migrated).toBe(false)
    expect(upstreamConversation.update).not.toHaveBeenCalled()
    expect(calls).toContain('desk:stopHitl')
  })

  it('keeps the old session untouched when opening the new one fails', async ({ expect }) => {
    // Arrange
    const { hookProps, calls, upstreamConversation, oldDownstreamConversation } = _makeFixture({ startHitlFails: true })

    // Act
    const result = await tryMigrateSession({
      props: hookProps,
      upstreamConversation: asConversation(upstreamConversation),
      downstreamConversation: asConversation(oldDownstreamConversation),
      backingIntegration: DESK_BACKING_INTEGRATION,
      sessionConfig: {},
    })

    // Assert
    expect(result.migrated).toBe(false)
    expect(calls).not.toContain('zendesk:stopHitl')
    expect(upstreamConversation.update).not.toHaveBeenCalled()
  })
})
