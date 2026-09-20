import { Chat, type ChatMessage, type MessageDeltaHandler, type MessageMetadata } from '../../src/chat/chat.js'
import type { Component } from '../../src/chat/component.js'
import type { Response } from '../../src/chat/response.js'

/** Collect real response and component callbacks in one assertion-friendly fixture. */
export function createTestChat({
  components = [],
  response,
  onMessage,
  onDelta,
}: {
  components?: Component[]
  response?: Response
  onMessage: (message: ChatMessage, metadata: MessageMetadata) => void | Promise<void>
  onDelta?: MessageDeltaHandler
}): Chat {
  const style = typeof response === 'string' ? { preset: response } : response

  return new Chat({
    response: {
      ...style,
      handler: (text, metadata) => onMessage({ type: 'text', text }, metadata),
      onDelta,
    },
    components: components.map((component) =>
      component.withHandler((props, metadata) =>
        onMessage({ type: 'component', name: component.definition.name, props }, metadata)
      )
    ),
  })
}
