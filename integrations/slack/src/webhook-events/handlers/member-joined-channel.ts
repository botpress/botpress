import { MemberJoinedChannelEvent } from '@slack/types'

import { getBotpressUserFromSlackUser, getBotpressConversationFromSlackThread } from '../../misc/utils'
import * as bp from '.botpress'

export const handleEvent = async ({
  slackEvent,
  client,
}: {
  slackEvent: MemberJoinedChannelEvent
  client: bp.Client
}) => {
  const { user: slackUserId, channel: slackChannelId, inviter: slackInviterId } = slackEvent
  const { botpressUserId } = await getBotpressUserFromSlackUser({ slackUserId }, client)
  const { botpressConversationId } = await getBotpressConversationFromSlackThread({ slackChannelId }, client)

  let inviterBotpressUserId
  if (slackInviterId) {
    const inviter = await getBotpressUserFromSlackUser({ slackUserId: slackInviterId }, client)
    inviterBotpressUserId = inviter.botpressUserId
  }

  await client.createEvent({
    type: 'memberJoinedChannel',
    payload: {
      botpressUserId,
      botpressConversationId,
      inviterBotpressUserId,
      targets: {
        slackUserId,
        slackChannelId,
        slackInviterId,
      },
    },
    conversationId: botpressConversationId,
    userId: botpressUserId,
  })
}
