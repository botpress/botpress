import { z } from '@botpress/sdk'
import * as bp from '.botpress'

export const handler = (async (props) => {
  /**
   * This is the incoming request handler. It is called by the external service you are integrating with.
   */
  const {
    client,
    req: { body },
  } = props

  if (!body) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'No body' }),
    }
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(body)
  } catch {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Invalid JSON Body' }),
    }
  }

  const parseResult = z
    .object({
      userId: z.string(),
      conversationId: z.string(),
      text: z.string(),
    })
    .safeParse(parsedBody)

  if (!parseResult.success) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Invalid body' }),
    }
  }

  const { userId, conversationId, text } = parseResult.data

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: conversationId,
      fromUserId: 'Unknown',
      chatId: 'Unknown',
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: userId,
    },
  })

  const { message } = await client.createMessage({
    type: 'text',
    conversationId: conversation.id,
    userId: user.id,
    payload: {
      text,
    },
    tags: {
      id: 'Unknown',
      chatId: 'Unknown',
    },
  })

  const response = {
    message,
  }

  return {
    status: 200,
    body: JSON.stringify(response),
  }
}) satisfies bp.IntegrationProps['handler']
