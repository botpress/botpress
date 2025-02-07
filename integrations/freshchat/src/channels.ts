import * as bp from '../.botpress'
import { getFreshchatClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.AnyMessageProps) => {
        const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)

        const { text: userMessage, userId } = props.payload

        const { user } = await client.getUser({ id: userId as string })

        const freshchatUserId = user.tags.id
        const freshchatConversationId = conversation.tags.id

        if (!freshchatConversationId?.length) {
          logger.forBot().error('No Freshchat Conversation Id')
          return
        }

        return await freshchatClient.sendMessage(
          freshchatUserId as string,
          freshchatConversationId as string,
          userMessage
        )
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
