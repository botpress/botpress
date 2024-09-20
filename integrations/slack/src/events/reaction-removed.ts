import { ReactionRemovedEvent } from '@slack/types'

import { Client } from '../misc/types'
import {
  getMessageFromSlackEvent,
  getBotpressConversationFromSlackThread,
  getBotpressUserFromSlackUser,
} from '../misc/utils'

export const executeReactionRemoved = async ({
  slackEvent,
  client,
}: {
  slackEvent: ReactionRemovedEvent
  client: Client
}) => {
  if (slackEvent.item.type !== 'message') {
    return
  }

  const { botpressUserId } = await getBotpressUserFromSlackUser({ slackUserId: slackEvent.user }, client)
  const { botpressConversationId } = await getBotpressConversationFromSlackThread(
    { slackChannelId: slackEvent.item.channel },
    client
  )

  const message = await getMessageFromSlackEvent(client, slackEvent)

  await client.createEvent({
    type: 'reactionRemoved',
    payload: {
      reaction: slackEvent.reaction,
      targets: {
        dm: { id: slackEvent.user },
        thread: { id: slackEvent.item.channel, thread: slackEvent.item.ts },
        channel: { id: slackEvent.item.channel },
      },
      userId: botpressUserId,
      conversationId: botpressConversationId,
    },
    conversationId: botpressConversationId,
    userId: botpressUserId,
    messageId: message?.id,
  })
}
