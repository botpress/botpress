import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { addCommentToDiscussion, addCommentToPage, addPageToDb, deleteBlock, getDb } from './actions'
import * as botpress from '.botpress'

const logger = console
logger.info('starting integration')

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

const integration = new botpress.Integration({
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
  register: async () => {},
  unregister: async () => {},
  actions: {
    deleteBlock,
    addCommentToDiscussion,
    addCommentToPage,
    addPageToDb,
    getDb,
  },
  handler: async () => {
    throw new NotImplementedError()
  },
})

export default sentryHelpers.wrapIntegration(integration)
