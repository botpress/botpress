import * as bp from '.botpress'

export const isValidUrl = (str: string) => {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export const getBotpressUserFromSlackUser = async (props: { slackUserId: string }, client: bp.Client) => {
  const { user } = await client.getOrCreateUser({
    tags: { id: props.slackUserId },
  })

  return {
    botpressUser: user,
    botpressUserId: user.id,
  }
}

export const getBotpressConversationFromSlackThread = async (
  props: { slackChannelId: string; slackThreadId?: string },
  client: bp.Client
) => {
  let conversation: bp.ClientResponses['getConversation']['conversation']

  if (props.slackThreadId) {
    const resp = await client.getOrCreateConversation({
      channel: 'thread',
      tags: { id: props.slackChannelId, thread: props.slackThreadId },
    })
    conversation = resp.conversation
  } else {
    const channel = props.slackChannelId.startsWith('D') ? 'dm' : 'channel'
    const resp = await client.getOrCreateConversation({
      channel,
      tags: { id: props.slackChannelId },
    })
    conversation = resp.conversation
  }

  return {
    botpressConversation: conversation,
    botpressConversationId: conversation.id,
  }
}

export const getMessageFromSlackEvent = async (
  client: bp.Client,
  event: { item: { type: string; channel?: string; ts?: string } }
) => {
  if (event.item.type !== 'message' || !event.item.channel || !event.item.ts) {
    return undefined
  }

  const { messages } = await client.listMessages({
    tags: { ts: event.item.ts, channelId: event.item.channel },
  })

  return messages[0]
}
