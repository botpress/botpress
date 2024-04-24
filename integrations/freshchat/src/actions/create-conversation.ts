import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'
import * as console from 'node:console'

export const createConversation: ActionCreateConversation = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  const { freshchatUserId } = input;

  if(!freshchatUserId?.length) {
    logger.forBot().error(`Invalid Freshchat User Associated: ${freshchatUserId}, please use getCreateUser to get a freshchat user.`)
    return;
  }

  return await freshchatClient.createConversation({ userId: freshchatUserId, transcript: input.transcript })
}
