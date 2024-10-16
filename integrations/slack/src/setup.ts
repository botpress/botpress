import { RuntimeError } from '@botpress/client'
import { WebClient } from '@slack/web-api'
import { SlackScopes } from './misc/slack-scopes'
import { CreateConversationFunction, CreateUserFunction, RegisterFunction, UnregisterFunction } from './misc/types'
import { getAccessToken, saveConfig, saveCredentials, updateBotpressBotNameAndAvatar } from './misc/utils'
import { Client, Context } from '.botpress'

export type SyncState = { usersLastSyncTs?: number }
export type Configuration = { botUserId?: string }

export const register: RegisterFunction = async ({ client, ctx, logger }) => {
  logger.forBot().debug('Registering Slack integration')

  if (ctx.configurationType === 'botToken') {
    if (!ctx.configuration.botToken || !ctx.configuration.signingSecret) {
      throw new RuntimeError(
        'Missing configuration: the Bot Token and Signing Secret are both required when using manual configuration'
      )
    }
    await saveCredentials(client, ctx, {
      accessToken: ctx.configuration.botToken,
      signingSecret: ctx.configuration.signingSecret,
    })
  }

  const accessToken = await getAccessToken(client, ctx)

  if (!accessToken) {
    return
  }

  const slackClient = new WebClient(accessToken)
  const identity = await slackClient.auth.test()

  const grantedScopes = identity.response_metadata?.scopes ?? []
  await SlackScopes.saveScopes({ client, ctx, scopes: grantedScopes })
  await SlackScopes.ensureHasAllScopes({
    client,
    ctx,
    requiredScopes: [
      'channels:history',
      'channels:manage',
      'channels:read',
      'chat:write',
      'groups:history',
      'groups:read',
      'groups:write',
      'im:history',
      'im:read',
      'im:write',
      'mpim:history',
      'mpim:read',
      'mpim:write',
      'reactions:read',
      'reactions:write',
      'team:read',
      'users.profile:read',
      'users:read',
    ],
    operation: 'auth.test',
  })

  const configuration: Configuration = { botUserId: identity.user_id }

  await saveConfig(client, ctx, configuration)

  await updateBotpressBotNameAndAvatar(client, ctx)
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
  const slackClient = new WebClient(accessToken)

  await SlackScopes.ensureHasAllScopes({
    client,
    ctx,
    requiredScopes: ['users:read'],
    operation: 'users.info',
  })
  const member = await slackClient.users.info({ user: userId })

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

  const slackClient = new WebClient(await getAccessToken(client, ctx))

  if (_isUserId(conversationId)) {
    const channelId = await _getDirectMessageForUser({ userId: conversationId, slackClient, client, ctx })
    conversationId = channelId || conversationId
  }

  await SlackScopes.ensureHasAllScopes({
    client,
    ctx,
    requiredScopes: ['im:read', 'channels:read', 'groups:read', 'mpim:read'],
    operation: 'conversations.info',
  })
  const response = await slackClient.conversations.info({ channel: conversationId })

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

const _isUserId = (id: string) => id.startsWith('U')

const _getDirectMessageForUser = async ({
  userId,
  slackClient,
  client,
  ctx,
}: {
  userId: string
  slackClient: WebClient
  client: Client
  ctx: Context
}) => {
  await SlackScopes.ensureHasAllScopes({ client, ctx, requiredScopes: ['im:write'], operation: 'conversations.open' })
  const conversation = await slackClient.conversations.open({ users: userId })

  return conversation.channel?.id
}
