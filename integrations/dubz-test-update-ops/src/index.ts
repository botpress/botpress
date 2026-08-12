import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

/**
 * Flip this to compare the two ways of handling message_updated/conversation_updated:
 * - false (default): unknownOperationHandler falls through, the new typed updateMessage/updateConversation callbacks handle it
 * - true: unknownOperationHandler hand-parses the body and short-circuits, exactly like before typed callbacks existed
 */
const USE_LEGACY_HANDLER = false

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    webhook: {
      messages: {
        text: async ({ logger, payload, client, conversation, message }) => {
          logger.forBot().info(`[outgoing] would send: "${payload.text}"`)

          // must come from the integration's own client (not the bot's) for conversation_updated to fire -
          // bridge's updateConversation operation only emits it when the caller authenticates as an integration instance
          await client.updateConversation({
            id: conversation.id,
            tags: { id: `touched-by-${message.id}` },
          })
        },
      },
      messageUpdated: {
        text: async ({ logger, currentMessage, previousMessage, conversation, user }) => {
          logger.forBot().info('[typed] messageUpdated fired', { currentMessage, previousMessage, conversation, user })
        },
      },
      conversationUpdated: async ({ logger, currentConversation, previousConversation }) => {
        logger.forBot().info('[typed] conversationUpdated fired', { currentConversation, previousConversation })
      },
    },
  },
  handler: async ({ client, req, logger }) => {
    if (!req.body) {
      return { status: 400, body: JSON.stringify({ error: 'No body' }) }
    }

    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(req.body)
    } catch {
      return { status: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
    }

    const parseResult = sdk.z
      .object({
        userId: sdk.z.string(),
        conversationId: sdk.z.string(),
        text: sdk.z.string(),
      })
      .safeParse(parsedBody)

    if (!parseResult.success) {
      return { status: 400, body: JSON.stringify({ error: 'Invalid body' }) }
    }

    const { userId, conversationId, text } = parseResult.data

    const { conversation } = await client.getOrCreateConversation({
      channel: 'webhook',
      tags: { id: conversationId },
    })

    const { user } = await client.getOrCreateUser({
      tags: { id: userId },
    })

    const { message } = await client.createMessage({
      type: 'text',
      conversationId: conversation.id,
      userId: user.id,
      payload: { text },
      tags: {},
    })

    logger.forBot().info(`[incoming] created message ${message.id} in conversation ${conversation.id}`)

    return { status: 200, body: JSON.stringify({ conversation, message }) }
  },
  __advanced: {
    unknownOperationHandler: async ({ ctx, req, logger }) => {
      if (ctx.operation !== 'message_updated' && ctx.operation !== 'conversation_updated') {
        return
      }

      if (!USE_LEGACY_HANDLER) {
        // fall through: handleOperation's switch will dispatch to updateMessage/updateConversation instead
        return
      }

      // simulates the old, pre-typed-callback way of doing this
      const parsed = req.body ? JSON.parse(req.body) : {}
      logger.forBot().info(`[legacy] unknownOperationHandler caught "${ctx.operation}"`, parsed)
      return { status: 200 }
    },
  },
})
