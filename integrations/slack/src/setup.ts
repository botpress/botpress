import { WebClient } from '@slack/web-api'
import { CreateConversationFunction, CreateUserFunction, RegisterFunction, UnregisterFunction } from './misc/types'
import { getAccessToken, getDirectMessageForUser, isUserId, saveConfig } from './misc/utils'

export type SyncState = { usersLastSyncTs?: number }
export type Configuration = { botUserId?: string }

export const register: RegisterFunction = async ({ client, ctx, logger }) => {
  logger.forBot().debug('Registering Slack integration')
  const accessToken = await getAccessToken(client, ctx)

  if (!accessToken) {
    return
  }

  const slack = new WebClient(accessToken)
  const identity = await slack.auth.test()

  const configuration: Configuration = { botUserId: identity.user_id }

  await saveConfig(client, ctx, configuration)
}

export const unregister: UnregisterFunction = async () => {
  // nothing to unregister
}

export const createUser: CreateUserFunction = async ({ client, tags, ctx }) => {
  const userId = tags.id
  if (!userId) {
    return
  }

  const accessToken = await getAccessToken(client, ctx)
  const slack = new WebClient(accessToken)
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
  let conversationId = tags.id
  const thread = (tags as Record<string, string>).thread // TODO: fix cast in SDK typings

  if (!conversationId) {
    return
  }

  const accessToken = await getAccessToken(client, ctx)

  if (isUserId(conversationId)) {
    const channelId = await getDirectMessageForUser(conversationId, accessToken)
    conversationId = channelId || conversationId
  }

  const slack = new WebClient(accessToken)
  const response = await slack.conversations.info({ channel: conversationId })

  if (!response.channel?.id) {
    return
  }

  type ThreadArgs = Parameters<typeof client.getOrCreateConversation<'thread'>>[0]
  type DmArgs = Parameters<typeof client.getOrCreateConversation<'dm' | 'channel'>>[0]

  const args: ThreadArgs | DmArgs =
    channel === 'thread'
      ? { channel, tags: { id: response.channel.id, thread } }
      : { channel, tags: { id: response.channel.id } }

  const { conversation } = await client.getOrCreateConversation(args)

  return {
    body: JSON.stringify({ conversation: { id: conversation.id, thread } }),
    headers: {},
    statusCode: 200,
  }
}
