import { resolveBackingIntegration, type HitlBackingIntegration } from '../../backing-integration'
import * as conv from '../../conv-manager'
import * as consts from '../consts'
import * as hitlAssigned from './hitl-assigned'
import * as hitlStopped from './hitl-stopped'
import * as bp from '.botpress'

const getConversationId = (props: bp.HookHandlerProps['before_incoming_event']): string | undefined => {
  const { data: event } = props
  if (event.conversationId) {
    return event.conversationId
  }
  if ('conversationId' in event.payload && typeof event.payload.conversationId === 'string') {
    return event.payload.conversationId
  }
  return undefined
}

/**
 * Matches an incoming event type against the hitl interface events published by
 * the current backing integration, applying its delivered renames. An event
 * from a different integration (a session still on a previous one) matches
 * only against the interface event names as published, since the delivered
 * renames cover the current backing integration alone.
 */
export const identifyHitlInterfaceEvent = (props: {
  eventType: string
  backingIntegration: HitlBackingIntegration
}): 'hitlAssigned' | 'hitlStopped' | undefined => {
  const separatorIndex = props.eventType.indexOf(':')
  if (separatorIndex < 0) {
    return undefined
  }
  const eventIntegrationAlias = props.eventType.slice(0, separatorIndex)
  const eventName = props.eventType.slice(separatorIndex + 1)
  const isCurrentBackingIntegration = eventIntegrationAlias === props.backingIntegration.alias
  for (const interfaceEvent of ['hitlAssigned', 'hitlStopped'] as const) {
    const expectedName = isCurrentBackingIntegration
      ? (props.backingIntegration.events?.[interfaceEvent] ?? interfaceEvent)
      : interfaceEvent
    if (eventName === expectedName) {
      return interfaceEvent
    }
  }
  return undefined
}

export const handleEvent: bp.HookHandlers['before_incoming_event']['*'] = async (props) => {
  const matched = identifyHitlInterfaceEvent({
    eventType: props.data.type,
    backingIntegration: resolveBackingIntegration(props),
  })
  // The match proves the event is the interface's event under the emitting
  // integration's name, and the Bridge validates payloads against the
  // integration's schemas, so the payload has the interface's shape even
  // though the wildcard hook cannot express that statically:
  if (matched === 'hitlAssigned') {
    return await hitlAssigned.handleEvent(props as Parameters<typeof hitlAssigned.handleEvent>[0])
  }
  if (matched === 'hitlStopped') {
    return await hitlStopped.handleEvent(props as Parameters<typeof hitlStopped.handleEvent>[0])
  }

  const conversationId = getConversationId(props)
  if (!conversationId) {
    return
  }

  const downstreamConversation = await props.conversations.hitl.hitl.getById({ id: conversationId })
  const downstreamCm = conv.ConversationManager.from(props, downstreamConversation)
  const isHitlActive = await downstreamCm.isHitlActive()
  if (isHitlActive) {
    /**
     * if conversation is downstream; we prevent the bot from answering in the ticket
     * if conversation is upstream; we prevent the bot from answering in the chat
     */
    return consts.STOP_EVENT_HANDLING
  }

  return
}
