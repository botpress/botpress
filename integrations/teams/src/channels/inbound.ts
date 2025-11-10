import { Activity, ConversationReference, TurnContext, TeamsInfo, TeamsChannelAccount } from 'botbuilder'
import { getAdapter, sleep } from '../utils'
import * as bp from '.botpress'

export const processInboundChannelMessage = async ({ client, ctx, logger }: bp.HandlerProps, activity: Activity) => {
  const convRef: Partial<ConversationReference> = TurnContext.getConversationReference(activity)

  const senderChannelAccount = activity.from!
  const adapter = getAdapter(ctx.configuration)

  const getUserPromise = new Promise<TeamsChannelAccount | undefined>((resolve, reject) => {
    void adapter
      .continueConversation(convRef, async (tc) => {
        const user = await TeamsInfo.getMember(tc, senderChannelAccount.id)
        resolve(user)
      })
      .then(() => resolve(undefined))
      .catch(reject)
  })

  const sender = await Promise.race([getUserPromise, sleep(2000)])
  if (sender?.email) {
    logger.forBot().info(`Received request from user: ${sender.email}`)
  }

  switch (activity.type) {
    case 'message':
      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          id: activity.conversation.id,
        },
      })

      await client.setState({
        id: conversation.id,
        name: 'conversation',
        type: 'conversation',
        payload: convRef,
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: activity.from.id,
          email: sender?.email,
        },
      })

      await client.getOrCreateMessage({
        tags: { id: activity.id },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: activity.text },
      })
      break
    default:
      return
  }
}
