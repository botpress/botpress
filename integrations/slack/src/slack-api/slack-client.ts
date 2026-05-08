import { collectableGenerator } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import * as SlackWebApi from '@slack/web-api'
import { handleErrorsDecorator as handleErrors, surfaceSlackErrors } from './error-handling'
import { getAppCredentials } from './slack-manifest-client'
import { SlackOAuthClient } from './slack-oauth-client'
import { requiresAllScopesDecorator as requireAllScopes } from './slack-scopes'
import * as bp from '.botpress'

export class SlackClient {
  private readonly _logger: bp.Logger
  private readonly _slackWebClient: SlackWebApi.WebClient
  private readonly _grantedScopes: string[]
  private readonly _botUserId: string
  private readonly _teamId: string

  private constructor(props: {
    logger: bp.Logger
    slackWebClient: SlackWebApi.WebClient
    grantedScopes: string[]
    botUserId: string
    teamId: string
  }) {
    this._logger = props.logger
    this._slackWebClient = props.slackWebClient
    this._grantedScopes = props.grantedScopes
    this._botUserId = props.botUserId
    this._teamId = props.teamId
  }

  public static async createFromStates({
    ctx,
    client,
    logger,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }) {
    const appCreds = await getAppCredentials(client, ctx)

    if (appCreds.clientId && appCreds.clientSecret) {
      const oAuthClient = new SlackOAuthClient({
        ctx,
        client,
        logger,
        clientIdOverride: appCreds.clientId,
        clientSecretOverride: appCreds.clientSecret,
      })
      return await SlackClient._createNewInstance({ logger, oAuthClient })
    }

    const oAuthClient = new SlackOAuthClient({ ctx, client, logger })
    return await SlackClient._createNewInstance({ logger, oAuthClient })
  }

  public static async createFromAuthorizationCode({
    ctx,
    client,
    logger,
    authorizationCode,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
    authorizationCode: string
  }) {
    const appCreds = await getAppCredentials(client, ctx)
    const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`

    if (appCreds.clientId && appCreds.clientSecret) {
      const oAuthClient = new SlackOAuthClient({
        ctx,
        client,
        logger,
        clientIdOverride: appCreds.clientId,
        clientSecretOverride: appCreds.clientSecret,
      })
      await oAuthClient.requestShortLivedCredentials.fromAuthorizationCode(authorizationCode, redirectUri)
      return await SlackClient._createNewInstance({ logger, oAuthClient })
    }

    const oAuthClient = new SlackOAuthClient({ ctx, client, logger })
    await oAuthClient.requestShortLivedCredentials.fromAuthorizationCode(authorizationCode)

    return await SlackClient._createNewInstance({ logger, oAuthClient })
  }

  private static async _createNewInstance({
    logger,
    oAuthClient,
  }: {
    logger: bp.Logger
    oAuthClient: SlackOAuthClient
  }) {
    const { accessToken, scopes, botUserId, teamId } = await oAuthClient.getAuthState()

    const slackWebClient = new SlackWebApi.WebClient(accessToken)

    return new SlackClient({ logger, slackWebClient, grantedScopes: scopes, botUserId, teamId })
  }

  @handleErrors('Failed to validate Slack authentication')
  public async testAuthentication() {
    surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.auth.test(),
    })
  }

  public getBotUserId(): string {
    return this._botUserId
  }

  public getTeamId(): string {
    return this._teamId
  }

  public getGrantedScopes(): Readonly<string[]> {
    return this._grantedScopes
  }

  public hasAllScopes(requiredScopes: string[]): boolean {
    return requiredScopes.every((scope) => this._grantedScopes.includes(scope))
  }

  @requireAllScopes(['reactions:write'])
  @handleErrors('Failed to add reaction to message')
  public async addReactionToMessage({
    channelId,
    messageTs,
    reactionName,
  }: {
    channelId: string
    messageTs: string
    reactionName: string
  }) {
    await this._slackWebClient.reactions.add({
      channel: channelId,
      timestamp: messageTs,
      name: reactionName,
    })
  }

  @requireAllScopes(['reactions:write'])
  @handleErrors('Failed to remove reaction from message')
  public async removeReactionFromMessage({
    channelId,
    messageTs,
    reactionName,
  }: {
    channelId: string
    messageTs: string
    reactionName: string
  }) {
    await this._slackWebClient.reactions.remove({
      channel: channelId,
      timestamp: messageTs,
      name: reactionName,
    })
  }

  public enumerateAllMembers = collectableGenerator(this._enumerateAllMembers.bind(this))

  @requireAllScopes(['users:read'])
  @handleErrors('Failed to enumerate Slack users')
  private async *_enumerateAllMembers({ limit }: { limit?: number } = {}) {
    let cursor: string | undefined
    let resultCount = 0

    do {
      const { members, response_metadata } = surfaceSlackErrors({
        logger: this._logger,
        response: await this._slackWebClient.users.list({
          cursor,
          limit: 200,
        }),
      })

      for (const member of members ?? []) {
        if (limit && resultCount++ > limit) {
          return
        } else if (member.deleted) {
          continue
        }
        yield member
      }

      cursor = response_metadata?.next_cursor
    } while ((!limit || resultCount < limit) && cursor)
  }

  public enumerateAllPublicChannels = collectableGenerator(this._enumerateAllPublicChannels.bind(this))

  @requireAllScopes(['channels:read'])
  @handleErrors('Failed to enumerate public Slack channels')
  private async *_enumerateAllPublicChannels({ limit }: { limit?: number } = {}) {
    let cursor: string | undefined
    let resultCount = 0

    do {
      const { channels, response_metadata } = surfaceSlackErrors({
        logger: this._logger,
        response: await this._slackWebClient.conversations.list({
          exclude_archived: true,
          cursor,
          limit: 200,
          types: 'public_channel',
        }),
      })

      for (const channel of channels ?? []) {
        if (limit && resultCount++ > limit) {
          return
        }
        yield channel
      }

      cursor = response_metadata?.next_cursor
    } while ((!limit || resultCount < limit) && cursor)
  }

  @requireAllScopes(['channels:history', 'groups:history', 'im:history', 'mpim:history'])
  @handleErrors('Failed to retrieve message')
  public async retrieveMessage({ channel, messageTs }: { channel: string; messageTs: string }) {
    const { messages } = surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.conversations.history({
        channel,
        limit: 1,
        inclusive: true,
        latest: messageTs,
      }),
    })

    const message = messages?.[0]

    if (!message) {
      throw new sdk.RuntimeError('No message found')
    }

    return message
  }

  @requireAllScopes(['channels:history', 'groups:history', 'im:history', 'mpim:history'])
  @handleErrors('Failed to retrieve latest channel message')
  public async getLatestChannelMessage({
    channelId,
    threadTs,
    oldestTs,
  }: {
    channelId: string
    threadTs?: string
    oldestTs?: string
  }) {
    if (threadTs) {
      const { messages } = surfaceSlackErrors({
        logger: this._logger,
        response: await this._slackWebClient.conversations.replies({
          channel: channelId,
          ts: threadTs,
          oldest: oldestTs,
        }),
      })
      return messages?.[messages.length - 1]
    }

    const { messages } = surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.conversations.history({
        channel: channelId,
        limit: 1,
        oldest: oldestTs,
      }),
    })

    return messages?.[0]
  }

  @requireAllScopes(['im:write'])
  @handleErrors('Failed to start DM with user')
  public async startDmWithUser(channelId: string) {
    surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.conversations.open({
        channel: channelId,
      }),
    })
    return channelId
  }

  @requireAllScopes(['channels:manage', 'groups:write', 'im:write', 'mpim:write'])
  @handleErrors('Failed to mark message as seen')
  public async markMessageAsSeen({ channelId, messageTs }: { channelId: string; messageTs: string }) {
    await this._slackWebClient.conversations.mark({
      channel: channelId,
      ts: messageTs,
    })
  }

  @requireAllScopes(['channels:manage', 'groups:write', 'mpim:write', 'im:write'])
  @handleErrors('Failed to set conversation topic')
  public async setConversationTopic({ channelId, topic }: { channelId: string; topic: string }) {
    await this._slackWebClient.conversations.setTopic({
      channel: channelId,
      topic,
    })
  }

  @requireAllScopes(['chat:write'])
  @handleErrors('Failed to post message')
  public async postMessage({
    channelId,
    text,
    threadTs,
    blocks,
    username,
    iconUrl,
  }: {
    channelId: string
    text?: string
    threadTs?: string
    blocks?: (SlackWebApi.Block | SlackWebApi.KnownBlock)[]
    username?: string
    iconUrl?: string
  }) {
    const response = surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.chat.postMessage({
        channel: channelId,
        text,
        thread_ts: threadTs,
        blocks,
        as_user: true,
        username,
        icon_url: iconUrl,
      }),
    })

    return response.message
  }

  @requireAllScopes(['files:write'])
  @handleErrors('Failed to upload file')
  public async uploadFile({
    channelId,
    threadTs,
    fileBuffer,
    filename,
    title,
    initialComment,
  }: {
    channelId: string
    threadTs?: string
    fileBuffer: Buffer
    filename: string
    title?: string
    initialComment?: string
  }) {
    const response = surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.files.uploadV2({
        channel_id: channelId,
        thread_ts: threadTs,
        file: fileBuffer,
        filename,
        title,
        initial_comment: initialComment,
      }),
    })

    return response
  }

  @requireAllScopes(['users:read'])
  @handleErrors('Failed to retrieve user profile')
  public async getUserProfile({ userId }: { userId: string }) {
    const response = surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.users.profile.get({
        user: userId,
      }),
    })

    return response.profile
  }

  @requireAllScopes(['channels:read', 'chat:write', 'groups:read', 'im:read', 'mpim:read'])
  @handleErrors('Failed to retrieve channels info')
  public async getChannelsInfo({
    includeArchived,
    includePrivate,
    includeDm,
    cursor,
  }: {
    includeArchived?: boolean
    includePrivate?: boolean
    includeDm?: boolean
    cursor?: string
  }) {
    const types = ['public_channel']
    if (includePrivate) {
      types.push('private_channel')
    }
    if (includeDm) {
      types.push('im', 'mpim')
    }
    const response = surfaceSlackErrors({
      logger: this._logger,
      response: await this._slackWebClient.conversations.list({
        types: types.join(','),
        exclude_archived: !includeArchived,
        limit: 200,
        cursor,
      }),
    })

    return {
      channels: (response.channels ?? []).map((ch) => ({
        id: ch.id ?? '',
        name: ch.name ?? ch.user ?? ch.id ?? '',
        topic: ch.topic?.value ?? '',
        purpose: ch.purpose?.value ?? '',
        numMembers: ch.num_members ?? 0,
        isPrivate: ch.is_private ?? false,
        isArchived: ch.is_archived ?? false,
        isDm: ch.is_im || ch.is_mpim || false,
        userId: ch.user ?? '',
        creator: ch.creator ?? '',
        created: ch.created ?? 0,
      })),
      nextCursor: response.response_metadata?.next_cursor || undefined,
    }
  }
}
