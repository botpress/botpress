import { describe, it, vi } from 'vitest'
import {
  callBackingIntegrationAction,
  resolveBackingIntegration,
  resolveBackingIntegrationForDownstreamConversation,
} from './backing-integration'

type ActionClient = Parameters<typeof callBackingIntegrationAction>[0]['client']

const COMPILED_INTERFACES = {
  hitl: {
    integrationAlias: 'zendesk',
    actions: { createUser: { name: 'createUser' }, startHitl: { name: 'startHitl' }, stopHitl: { name: 'stopHitl' } },
    events: { hitlAssigned: { name: 'hitlAssigned' }, hitlStopped: { name: 'hitlStopped' } },
  },
}

const _makeProps = (configuration: Record<string, unknown>) => ({
  ctx: { configuration: configuration as { payload: string } },
  alias: 'hitl',
  interfaces: COMPILED_INTERFACES,
})

describe.concurrent(resolveBackingIntegration, () => {
  it('returns the compiled mapping when the reserved key is absent', ({ expect }) => {
    // Arrange
    const props = _makeProps({ payload: '{}' })

    // Act
    const backingIntegration = resolveBackingIntegration(props)

    // Assert
    expect(backingIntegration).toEqual({ alias: 'zendesk', actions: {}, events: {}, source: 'compiled' })
  })

  it('returns the compiled renames when the implementation renames a symbol', ({ expect }) => {
    // Arrange
    const props = {
      ..._makeProps({ payload: '{}' }),
      interfaces: {
        hitl: {
          ...COMPILED_INTERFACES.hitl,
          actions: { ...COMPILED_INTERFACES.hitl.actions, startHitl: { name: 'openConversation' } },
        },
      },
    }

    // Act
    const backingIntegration = resolveBackingIntegration(props)

    // Assert
    expect(backingIntegration).toEqual({
      alias: 'zendesk',
      actions: { startHitl: 'openConversation' },
      events: {},
      source: 'compiled',
    })
  })

  it('returns the delivered alias when the reserved key holds a bare string', ({ expect }) => {
    // Arrange
    const props = _makeProps({ payload: '{}', __botpress_reserved: { ifaces: { hitl: { hitl: 'desk' } } } })

    // Act
    const backingIntegration = resolveBackingIntegration(props)

    // Assert
    expect(backingIntegration).toEqual({ alias: 'desk', source: 'configuration' })
  })

  it('returns the delivered object with only the renamed symbols', ({ expect }) => {
    // Arrange
    const props = _makeProps({
      payload: '{}',
      __botpress_reserved: {
        ifaces: { hitl: { hitl: { alias: 'acme-helpdesk', actions: { startHitl: 'openConversation' } } } },
      },
    })

    // Act
    const backingIntegration = resolveBackingIntegration(props)

    // Assert
    expect(backingIntegration).toEqual({
      alias: 'acme-helpdesk',
      actions: { startHitl: 'openConversation' },
      source: 'configuration',
    })
  })

  it('returns the compiled mapping when the delivered alias is empty', ({ expect }) => {
    // Arrange
    const props = _makeProps({ payload: '{}', __botpress_reserved: { ifaces: { hitl: { hitl: '' } } } })

    // Act
    const backingIntegration = resolveBackingIntegration(props)

    // Assert
    expect(backingIntegration.alias).toBe('zendesk')
    expect(backingIntegration.source).toBe('compiled')
  })

  it('returns the compiled mapping when the reserved key is malformed', ({ expect }) => {
    // Arrange
    const props = _makeProps({ payload: '{}', __botpress_reserved: { ifaces: 42 } })

    // Act
    const backingIntegration = resolveBackingIntegration(props)

    // Assert
    expect(backingIntegration.alias).toBe('zendesk')
    expect(backingIntegration.source).toBe('compiled')
  })
})

describe.concurrent(resolveBackingIntegrationForDownstreamConversation, () => {
  it('keeps the compiled renames for a downstream conversation living on the compiled dependency', ({ expect }) => {
    // Arrange: the mapping was switched to desk, but the downstream
    //          conversation lives on the compiled zendesk dependency, which
    //          renames stopHitl
    const props = {
      ..._makeProps({ payload: '{}', __botpress_reserved: { ifaces: { hitl: { hitl: 'desk' } } } }),
      interfaces: {
        hitl: {
          ...COMPILED_INTERFACES.hitl,
          actions: { ...COMPILED_INTERFACES.hitl.actions, stopHitl: { name: 'closeConversation' } },
        },
      },
    }

    // Act
    const backingIntegration = resolveBackingIntegrationForDownstreamConversation({
      props,
      downstreamIntegrationAlias: 'zendesk',
    })

    // Assert
    expect(backingIntegration).toEqual({ alias: 'zendesk', actions: { stopHitl: 'closeConversation' }, events: {} })
  })

  it('uses the verbatim interface symbol names for a downstream conversation on an unknown previous integration', ({
    expect,
  }) => {
    // Arrange
    const props = _makeProps({ payload: '{}', __botpress_reserved: { ifaces: { hitl: { hitl: 'desk' } } } })

    // Act
    const backingIntegration = resolveBackingIntegrationForDownstreamConversation({
      props,
      downstreamIntegrationAlias: 'freshchat',
    })

    // Assert
    expect(backingIntegration).toEqual({ alias: 'freshchat' })
  })
})

describe.concurrent(callBackingIntegrationAction, () => {
  it('composes the action type from the alias and the renamed action name', async ({ expect }) => {
    // Arrange
    const callAction = vi.fn().mockResolvedValue({ output: { conversationId: 'conv_abc123' } })
    const client = { callAction } as unknown as ActionClient
    const input = { title: 'potato issue', userId: 'user_abc123', messageHistory: [] }

    // Act
    const result = await callBackingIntegrationAction({
      client,
      backingIntegration: { alias: 'acme-helpdesk', actions: { startHitl: 'openConversation' } },
      name: 'startHitl',
      input,
    })

    // Assert
    expect(callAction).toHaveBeenCalledWith({ type: 'acme-helpdesk:openConversation', input })
    expect(result.conversationId).toBe('conv_abc123')
  })

  it('uses the verbatim action name when the backing integration carries no renames', async ({ expect }) => {
    // Arrange
    const callAction = vi.fn().mockResolvedValue({ output: {} })
    const client = { callAction } as unknown as ActionClient

    // Act
    await callBackingIntegrationAction({
      client,
      backingIntegration: { alias: 'zendesk' },
      name: 'stopHitl',
      input: { conversationId: 'conv_abc123' },
    })

    // Assert
    expect(callAction).toHaveBeenCalledWith({ type: 'zendesk:stopHitl', input: { conversationId: 'conv_abc123' } })
  })
})
