import { Activity, ConversationReference, TurnContext, TeamsInfo, TeamsChannelAccount } from 'botbuilder'
import { authorizeRequest } from './signature'
import { getAdapter, sleep } from './utils'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  await authorizeRequest(req)

  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const activity: Activity = JSON.parse(req.body)
  console.info(`Handler received event of type ${activity.type}`)

  if (!activity.id) {
    return
  }

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
