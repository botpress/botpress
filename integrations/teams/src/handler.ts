import { Activity, ConversationReference, TurnContext } from 'botbuilder'
import { authorizeRequest } from './signature'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client }) => {
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
