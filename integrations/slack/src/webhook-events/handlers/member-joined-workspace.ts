import { TeamJoinEvent } from '@slack/types'

import { getBotpressUserFromSlackUser } from '../../misc/utils'
import * as bp from '.botpress'

export const handleEvent = async ({ slackEvent, client }: { slackEvent: TeamJoinEvent; client: bp.Client }) => {
  const slackUserId = slackEvent.user.id
  const { botpressUserId } = await getBotpressUserFromSlackUser({ slackUserId }, client)

  await client.createEvent({
    type: 'memberJoinedWorkspace',
    payload: {
      userId: botpressUserId,
      target: {
        userId: slackUserId,
        userName: slackEvent.user.name,
        userRealName: slackEvent.user.real_name,
        userDisplayName: slackEvent.user.profile.display_name,
      },
    },
    userId: botpressUserId,
  })
}
