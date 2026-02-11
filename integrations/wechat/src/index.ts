import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async (props) => {
          props.logger.info('Text Channel is NOT Implemented yet')
        },
        video: async (props) => {
          props.logger.info('Video Channel is NOT Implemented yet')
        },
        image: async (props) => {
          props.logger.info('Image Channel is NOT Implemented yet')
        },
      },
    },
  },
  handler: async (props) => {
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

    const parseResult = sdk.z
      .object({
        userId: sdk.z.string(),
        conversationId: sdk.z.string(),
        text: sdk.z.string(),
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
  },
})
