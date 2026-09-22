import { Chat, type ChatMessage, type MessageDeltaHandler, type MessageMetadata } from '../../chat/chat.js'
import type { Component } from '../../chat/component.js'

/** Collect both delivery paths when testing execution order and receipts. */
export function createRecordingChat({
  handler,
  onMessageDelta,
  components = [],
}: {
  handler: (message: ChatMessage, metadata: MessageMetadata) => Promise<void> | void
  onMessageDelta?: MessageDeltaHandler
  components?: Component[]
}): Chat {
  return new Chat({
    response: {
      handler: (text, metadata) => handler({ type: 'text', text }, metadata),
      onDelta: onMessageDelta,
    },
    components: components.map((component) =>
      component.withHandler((props, metadata) =>
        handler({ type: 'component', name: component.definition.name, props }, metadata)
      )
    ),
  })
}
