import { ReactionAddedEvent } from '@slack/bolt'

import { Client } from '../misc/types'
import { getUserAndConversation } from '../misc/utils'

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
  })
}
