import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'
import * as console from 'node:console'

export const listenConversation: ActionCreateConversation = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  const { freshchatConversationId, botpressConversationId } = input;

  if(!freshchatConversationId?.length) {
    logger.forBot().error(`Invalid Freshchat conversation for listen: ${freshchatConversationId}, please create a new Freshchat conversation.`)
    return { success: false };
  }

  if(!botpressConversationId?.length) {
    logger.forBot().error(`Invalid Botpress conversation for listen: ${botpressConversationId}, please specify a valid one.`)
    return { success: false };
  }

  await client.createConversation({
    channel: 'channel',
    tags: {
      freshchatConversationId,
      botpressConversationId,
    }
  })

  return { success: true }
}
