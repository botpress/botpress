import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import { IntegrationConfig } from 'src/config/integration-config'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { GmailClient, GoogleOAuth2Client } from './types'
import * as bp from '.botpress'

export class GoogleClient {
  private constructor(
    private readonly _gmail: GmailClient,
    private readonly _topicName: string
  ) {}

  public static async create({
    client,
    ctx,
    refreshToken,
  }: {
    client: bp.Client
    ctx: bp.Context
    refreshToken?: string
  }) {
    const token = refreshToken ?? (await GoogleClient._getRefreshTokenFromStates({ client, ctx }))

    const oauth2Client = GoogleClient._getOAuthClient({ ctx })
    oauth2Client.setCredentials({ refresh_token: token })

    const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client })
    const topicName = IntegrationConfig.getPubSubTopicName({ ctx })

    return new GoogleClient(gmailClient, topicName)
  }

  public static async createFromAuthorizationCode({
    client,
    ctx,
    authorizationCode,
  }: {
    client: bp.Client
    ctx: bp.Context
    authorizationCode: string
  }) {
    const refreshToken = await GoogleClient._exchangeAuthorizationCodeForRefreshToken({ ctx, authorizationCode })

    await GoogleClient._saveRefreshTokenIntoStates({ client, ctx, refreshToken })

    return GoogleClient.create({ client, ctx, refreshToken })
  }

  @handleErrors('Failed to watch incoming mail')
  public async watchIncomingMail() {
    await this._gmail.users.watch({
      userId: 'me',
      requestBody: { topicName: this._topicName },
    })
  }

  @handleErrors('Failed to get email address')
  public async getMyEmail() {
    const profile = await this._gmail.users.getProfile({
      userId: 'me',
    })

    return profile.data.emailAddress
  }

  @handleErrors('Failed to get history')
  public async getMyHistory(startHistoryId?: string) {
    const history = await this._gmail.users.history.list({
      startHistoryId,
      historyTypes: ['messageAdded'],
      userId: 'me',
    })

    return history.data
  }

  @handleErrors('Failed to get message')
  public async getMessageById(messageId: string) {
    const message = await this._gmail.users.messages.get({ id: messageId, userId: 'me' })

    return message.data
  }

  @handleErrors('Failed to send email')
  public async sendRawEmail(raw: string, threadId?: string) {
    const newMail = await this._gmail.users.messages.send({ requestBody: { raw, threadId }, userId: 'me' })

    return newMail.data
  }

  @handleErrors('Failed to list messages')
  public async listMessages({
    query,
    maxResults,
    pageToken,
  }: {
    query?: string
    maxResults?: number
    pageToken?: string
  } = {}) {
    const response = await this._gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
      pageToken,
    })

    return response.data
  }

  @handleErrors('Failed to delete message')
  public async deleteMessage(messageId: string) {
    await this._gmail.users.messages.delete({ id: messageId, userId: 'me' })
  }

  private static async _getRefreshTokenFromStates({ client, ctx }: { client: bp.Client; ctx: bp.Context }) {
    const { state } = await client.getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })

    return state.payload.refreshToken
  }

  private static async _saveRefreshTokenIntoStates({
    client,
    ctx,
    refreshToken,
  }: {
    client: bp.Client
    ctx: bp.Context
    refreshToken: string
  }) {
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { refreshToken },
    })
  }

  private static async _exchangeAuthorizationCodeForRefreshToken({
    ctx,
    authorizationCode,
  }: {
    ctx: bp.Context
    authorizationCode: string
  }) {
    const refreshToken = await GoogleClient._getRefreshToken({ ctx, authorizationCode })

    if (!refreshToken) {
      throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
    }

    return refreshToken
  }

  private static async _getRefreshToken({ ctx, authorizationCode }: { ctx: bp.Context; authorizationCode: string }) {
    const oauth2Client = GoogleClient._getOAuthClient({ ctx })

    try {
      const response = await oauth2Client.getToken(authorizationCode)
      return response.tokens.refresh_token ?? null
    } catch (thrown) {
      GoogleClient._handleRefreshTokenError({ ctx, thrown })
    }

    return null
  }

  private static _handleRefreshTokenError({ ctx, thrown }: { ctx: bp.Context; thrown: unknown }) {
    console.error('Error exchanging authorization code for refresh token', thrown)

    if (ctx.configurationType === 'customApp') {
      throw new sdk.RuntimeError(
        'Unable to exchange authorization code for refresh token: this may be due to an expired authorization code.' +
          'Please try the OAuth flow again and update the integration settings with the new authorization code.'
      )
    }
  }

  private static _getOAuthClient({ ctx }: { ctx: bp.Context }): GoogleOAuth2Client {
    const { clientId, clientSecret, endpoint } = IntegrationConfig.getOAuthConfig({ ctx })

    return new google.auth.OAuth2(clientId, clientSecret, endpoint)
  }
}
