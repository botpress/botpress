import { addCommentToDiscussion, addCommentToPage, addPageToDb, deleteBlock, getDb } from './actions'
import { getNotionBotUser, handleOAuthCallback } from './notion'
import * as bp from '.botpress'

export default new bp.Integration({
  createConversation: async ({ client, channel }) => {
    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: {},
    })
    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  channels: {},
  register: async ({ ctx, client }) => {
    await getNotionBotUser(ctx, client)
  },
  unregister: async () => {},
  actions: {
    deleteBlock,
    addCommentToDiscussion,
    addCommentToPage,
    addPageToDb,
    getDb,
  },
  handler: async (props) => {
    const { req, logger } = props
    if (req.path.startsWith('/oauth')) {
      logger.forBot().info('Handling Notion OAuth callback')

      await handleOAuthCallback(props)
    }

    console.debug('Received unknown webhook event', req)
  },
})
