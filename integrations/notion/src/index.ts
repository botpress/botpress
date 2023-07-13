import * as botpress from '.botpress'
import { addCommentToDiscussion, addCommentToPage, addPageToDb, deleteBlock, getDb } from './actions'
import { discussion, text } from './channels'

const logger = console
logger.info('starting integration')

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
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
  register: async () => { },
  unregister: async () => { },
  actions: {
    deleteBlock,
    addCommentToDiscussion,
    addCommentToPage,
    addPageToDb,
    getDb,
  },
  channels: {
    comments: {
      messages: {
        text,
        discussion
      }
    },
  },
  handler: async () => {
    throw new NotImplementedError()
  },
})
