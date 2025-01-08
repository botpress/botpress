import { addCommentToDiscussion, addCommentToPage, addPageToDb, deleteBlock, getDb } from './actions'
import * as bp from '.botpress'

class NotImplementedError extends Error {
  public constructor() {
    super('Not implemented')
  }
}

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
