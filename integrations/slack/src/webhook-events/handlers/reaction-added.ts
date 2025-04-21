import { ReactionAddedEvent } from '@slack/types'

import {
  getMessageFromSlackEvent,
  getBotpressConversationFromSlackThread,
  getBotpressUserFromSlackUser,
} from '../../misc/utils'
import * as bp from '.botpress'

export const handleEvent = async ({ slackEvent, client }: { slackEvent: ReactionAddedEvent; client: bp.Client }) => {
  const { botpressConversationId } = await getBotpressConversationFromSlackThread(
    { slackChannelId: slackEvent.item.channel },
    client
  )
  const { botpressUserId } = await getBotpressUserFromSlackUser({ slackUserId: slackEvent.user }, client)

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
      userId: botpressUserId,
      conversationId: botpressConversationId,
    },
    userId: botpressUserId,
    conversationId: botpressConversationId,
    messageId: message?.id,
  })
}
