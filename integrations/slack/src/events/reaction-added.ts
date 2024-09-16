import { ReactionAddedEvent } from '@slack/types'

import { Client } from '../misc/types'
import { getMessageFromSlackEvent, getUserAndConversation } from '../misc/utils'

export const executeReactionAdded = async ({
  slackEvent,
  client,
}: {
  slackEvent: ReactionAddedEvent
  client: Client
}) => {
  const { userId, conversationId } = await getUserAndConversation(
    { slackUserId: slackEvent.user, slackChannelId: slackEvent.item.channel },
    client
  )

  const message = await getMessageFromSlackEvent(client, slackEvent)

  await client.createEvent({
    type: 'reactionAdded',
    payload: {
      reaction: slackEvent.reaction,
      targets: {
        dm: { id: slackEvent.user },
        thread: 'ts' in slackEvent.item ? { id: slackEvent.item.channel, thread: slackEvent.item.ts } : undefined,
        channel: { id: slackEvent.item.channel },
      },
      userId,
      conversationId,
    },
    conversationId,
    userId,
    messageId: message?.id,
  })
}
