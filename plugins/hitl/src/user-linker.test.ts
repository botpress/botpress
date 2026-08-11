import { describe, it, vi } from 'vitest'
import type * as types from './types'
import { UserLinker } from './user-linker'

const _makeProps = (upstreamUserTags: Record<string, string>) => {
  const upstreamUser = {
    id: 'user_abc123',
    name: 'Potato Farmer',
    tags: upstreamUserTags,
    update: vi.fn(),
  }
  upstreamUser.update.mockResolvedValue(upstreamUser)
  const downstreamUser = { id: 'user_def456', tags: {}, update: vi.fn() }
  downstreamUser.update.mockResolvedValue(downstreamUser)
  const getById = vi
    .fn()
    .mockImplementation(async ({ id }: { id: string }) => (id === 'user_abc123' ? upstreamUser : downstreamUser))
  const callAction = vi.fn().mockResolvedValue({ output: { userId: 'user_def456' } })
  const props = {
    users: { getById },
    client: { callAction },
    ctx: { botId: 'bot_abc123', configuration: { payload: '{}' } },
    interfaces: { hitl: { integrationAlias: 'zendesk', name: 'zendesk', actions: {}, events: {}, channels: {} } },
    logger: { error: vi.fn() },
  } as unknown as types.AnyHandlerProps
  return { props, callAction, upstreamUser }
}

const DESK_BACKING_INTEGRATION = { alias: 'desk' }

describe.concurrent(UserLinker, () => {
  it('reuses the link when the stored alias matches the backing integration', async ({ expect }) => {
    // Arrange
    const { props, callAction } = _makeProps({ downstream: 'user_def456', integrationAlias: 'desk' })
    const linker = new UserLinker(props, DESK_BACKING_INTEGRATION)

    // Act
    const downstreamUserId = await linker.getDownstreamUserId('user_abc123')

    // Assert
    expect(downstreamUserId).toBe('user_def456')
    expect(callAction).not.toHaveBeenCalled()
  })

  it('creates a fresh link on the backing integration when the stored alias differs', async ({ expect }) => {
    // Arrange
    const { props, callAction, upstreamUser } = _makeProps({ downstream: 'user_old789', integrationAlias: 'zendesk' })
    const linker = new UserLinker(props, DESK_BACKING_INTEGRATION)

    // Act
    const downstreamUserId = await linker.getDownstreamUserId('user_abc123')

    // Assert
    expect(callAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'desk:createUser' }))
    expect(downstreamUserId).toBe('user_def456')
    expect(upstreamUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ tags: expect.objectContaining({ integrationAlias: 'desk' }) })
    )
  })

  it('treats a legacy name-only link as unlinked', async ({ expect }) => {
    // Arrange
    const { props, callAction } = _makeProps({ downstream: 'user_old789', integrationName: 'desk' })
    const linker = new UserLinker(props, DESK_BACKING_INTEGRATION)

    // Act
    await linker.getDownstreamUserId('user_abc123')

    // Assert
    expect(callAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'desk:createUser' }))
  })
})
