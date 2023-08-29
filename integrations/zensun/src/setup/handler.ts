import type { Handler } from '../misc/types'

export const handler: Handler = async ({ req, client }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }
  const AllowedTypes = ['text']
  const data = JSON.parse(req.body)

  for (const event of data.events) {
    if (event.type !== 'conversation:message') {
      console.warn('Received an event that is not a message')
      continue
    }

    const payload = event.payload

    if (
      payload.message.author.type === 'business' &&
      payload.message.source.type === 'zd:agentWorkspace' &&
      AllowedTypes.includes(payload.message.content.type)
    ) {
      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          'zensun:id': payload.conversation.id,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          'zensun:id': payload.message.author.userId,
        },
      })

      await client.createMessage({
        tags: { 'zensun:id': payload.message.id },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: payload.message.content.text },
      })
    }
  }
}
