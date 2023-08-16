import { GenericMessageEvent } from '@slack/bolt'
import { Client } from '../misc/types'
import { getUserAndConversation } from '../misc/utils'

export const executeMessageReceived = async ({
  slackEvent,
  client,
}: {
  slackEvent: GenericMessageEvent
  client: Client
}) => {
  // prevents the bot from answering itself
  if (slackEvent.bot_id) {
    return
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
    ...(await getUserAndConversation(
      { slackUserId: slackEvent.user, slackChannelId: slackEvent.channel, slackThreadId: slackEvent.thread_ts },
      client
    )),
  })
}
