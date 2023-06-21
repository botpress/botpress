import { WebClient } from '@slack/web-api'
import { CreateConversationFunction, CreateUserFunction, RegisterFunction, UnregisterFunction } from './misc/types'
import { getDirectMessageForUser, getTag, isUserId, saveConfig } from './misc/utils'

export type Configuration = { botUserId?: string }

export const register: RegisterFunction = async ({ client, ctx }) => {
  const slack = new WebClient(ctx.configuration.botToken)
  const identity = await slack.auth.test()

  const configuration: Configuration = { botUserId: identity.user_id }

  await saveConfig(client, ctx, configuration)
}

export const unregister: UnregisterFunction = async () => {
  // nothing to unregister
}

export const createUser: CreateUserFunction = async ({ client, tags, ctx }) => {
  const userId = getTag(tags, 'id')

  if (!userId) {
    return
  }

  const slack = new WebClient(ctx.configuration.botToken)
  const member = await slack.users.info({ user: userId })

  if (!member.user?.id) {
    return
  }

  const { user } = await client.getOrCreateUser({ tags: { id: member.user?.id } })

  return {
    body: JSON.stringify({ user: { id: user.id } }),
    headers: {},
    statusCode: 200,
  }
}

export const createConversation: CreateConversationFunction = async ({ client, channel, tags, ctx }) => {
  let conversationId = getTag(tags, 'id')
  const thread = getTag(tags, 'thread')

  if (!conversationId) {
    return
  }

  if (isUserId(conversationId)) {
    const channelId = await getDirectMessageForUser(conversationId, ctx.configuration.botToken)
    conversationId = channelId || conversationId
  }

  const slack = new WebClient(ctx.configuration.botToken)
  const response = await slack.conversations.info({ channel: conversationId })

  if (!response.channel?.id) {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel,
    tags: { id: response.channel.id, thread: thread! },
  })

  return {
    body: JSON.stringify({ conversation: { id: conversation.id, thread } }),
    headers: {},
    statusCode: 200,
  }
}
