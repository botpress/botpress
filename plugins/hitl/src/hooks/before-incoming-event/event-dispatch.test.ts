import { describe, it } from 'vitest'
import { identifyHitlInterfaceEvent } from './all'

const BACKING_INTEGRATION = { alias: 'desk' }

describe.concurrent(identifyHitlInterfaceEvent, () => {
  it.for([
    {
      case: 'assignment from the current backing integration',
      eventType: 'desk:hitlAssigned',
      expected: 'hitlAssigned',
    },
    { case: 'stop from the current backing integration', eventType: 'desk:hitlStopped', expected: 'hitlStopped' },
    {
      case: 'stop from another integration handling an old session',
      eventType: 'zendesk:hitlStopped',
      expected: 'hitlStopped',
    },
    { case: 'an unrelated integration event', eventType: 'desk:conversationCommented', expected: undefined },
    { case: 'an unprefixed bot event', eventType: 'humanAgentAssignedTimeout', expected: undefined },
  ])('returns $expected for $case', ({ eventType, expected }, { expect }) => {
    // Arrange
    const backingIntegration = BACKING_INTEGRATION

    // Act
    const matched = identifyHitlInterfaceEvent({ eventType, backingIntegration })

    // Assert
    expect(matched).toBe(expected)
  })

  it('honors the delivered event rename for the current backing integration only', ({ expect }) => {
    // Arrange
    const backingIntegration = { alias: 'acme-helpdesk', events: { hitlAssigned: 'agentJoined' } }

    // Act
    const matchedRenamed = identifyHitlInterfaceEvent({ eventType: 'acme-helpdesk:agentJoined', backingIntegration })
    const matchedOldBacking = identifyHitlInterfaceEvent({ eventType: 'zendesk:hitlAssigned', backingIntegration })

    // Assert
    expect(matchedRenamed).toBe('hitlAssigned')
    expect(matchedOldBacking).toBe('hitlAssigned')
  })
})
