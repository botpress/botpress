import { MemberLeftChannelEvent } from '@slack/types'

import { Client } from '../misc/types'
import { getBotpressUserFromSlackUser, getBotpressConversationFromSlackThread } from '../misc/utils'

export const executeMemberLeftChannel = async ({
  slackEvent,
  client,
}: {
  slackEvent: MemberLeftChannelEvent
  client: Client
}) => {
  const { user: slackUserId, channel: slackChannelId } = slackEvent
  const { botpressUserId } = await getBotpressUserFromSlackUser({ slackUserId }, client)
  const { botpressConversationId } = await getBotpressConversationFromSlackThread({ slackChannelId }, client)

  await client.createEvent({
    type: 'memberLeftChannel',
    payload: {
      botpressUserId,
      botpressConversationId,
      targets: {
        slackUserId,
        slackChannelId,
      },
    },
    conversationId: botpressConversationId,
    userId: botpressUserId,
  })
}
