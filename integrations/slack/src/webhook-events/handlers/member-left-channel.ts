import { MemberLeftChannelEvent } from '@slack/types'

import { getBotpressUserFromSlackUser, getBotpressConversationFromSlackThread } from '../../misc/utils'
import * as bp from '.botpress'

export const handleEvent = async ({
  slackEvent,
  client,
}: {
  slackEvent: MemberLeftChannelEvent
  client: bp.Client
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
