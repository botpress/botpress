import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

const reqBodySchema = sdk.z.object({
  userId: sdk.z.string(),
  conversationId: sdk.z.string(),
  text: sdk.z.string(),
})

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {},
  channels: {
    webhook: {
      messages: {
        text: async (props) => {
          /**
           * This is the outgoing message handler. It is called when a bot sends a message to the user.
           */
          const {
            ctx: {
              configuration: { webhookUrl },
            },
            conversation: { id: conversationId },
            user: { id: userId },
            payload: { text },
          } = props

          const requestBody = {
            userId,
            conversationId,
            text,
          }

          await axios.post(webhookUrl, requestBody)
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

    const parseResult = reqBodySchema.safeParse(parsedBody)
    if (!parseResult.success) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'Invalid body' }),
      }
    }

    const { userId, conversationId, text } = parseResult.data

    const { conversation } = await client.getOrCreateConversation({
      channel: 'webhook',
      tags: {
        id: conversationId,
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
      tags: {},
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
