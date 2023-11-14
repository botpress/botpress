import { GenericMessageEvent } from '@slack/bolt'
import { Client, IntegrationCtx, IntegrationLogger } from '../misc/types'
import { getAccessToken, getSlackUserProfile, getUserAndConversation } from '../misc/utils'

export const executeMessageReceived = async ({
  slackEvent,
  client,
  ctx,
  logger,
}: {
  slackEvent: GenericMessageEvent
  client: Client
  ctx: IntegrationCtx
  logger: IntegrationLogger
}) => {
  // prevents the bot from answering itself
  if (slackEvent.bot_id) {
    return
  }

  const { user, userId, conversationId } = await getUserAndConversation(
    { slackUserId: slackEvent.user, slackChannelId: slackEvent.channel, slackThreadId: slackEvent.thread_ts },
    client
  )

  if (!user.pictureUrl || !user.name) {
    try {
      const accessToken = await getAccessToken(client, ctx)
      const userProfile = await getSlackUserProfile(accessToken, slackEvent.user)
      const fieldsToUpdate = {
        pictureUrl: userProfile?.image_192,
        name: userProfile?.real_name,
      }
      if (fieldsToUpdate.pictureUrl || fieldsToUpdate.name) {
        await client.updateUser({ ...user, ...fieldsToUpdate })
      }
    } catch (error) {
      logger.forBot().error('Error while fetching user profile from Slack:', error)
    }
  }

  await client.createMessage({
    tags: { ts: slackEvent.ts },
    type: 'text',
    payload: {
      text: slackEvent.text!,

      // TODO: declare in definition
      // targets: {
      //   dm: { id: slackEvent.user },
      //   thread: { id: slackEvent.channel || slackEvent.user, thread: slackEvent.thread_ts || slackEvent.ts },
      //   channel: { id: slackEvent.channel },
      // },
    },
    userId,
    conversationId,
  })
}
