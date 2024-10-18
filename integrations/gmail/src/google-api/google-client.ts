import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import { GmailClient, GoogleOAuth2Client } from './types'
import * as bp from '.botpress'

const GLOBAL_OAUTH_ENDPOINT = `${process.env.BP_WEBHOOK_URL}/oauth` as const

export class GoogleClient {
  private constructor(private readonly _gmail: GmailClient) {}

  public static async create({
    client,
    ctx,
    refreshToken,
  }: {
    client: bp.Client
    ctx: bp.Context
    refreshToken?: string
  }) {
    const token = refreshToken ?? (await this._getRefreshTokenFromStates({ client, ctx }))

    const oauth2Client = this._getOAuthClient()
    oauth2Client.setCredentials({ refresh_token: token })

    const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client })

    return new GoogleClient(gmailClient)
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
    const refreshToken = await this._exchangeAuthorizationCodeForRefreshToken(authorizationCode)

    await this._saveRefreshTokenIntoStates({ client, ctx, refreshToken })

    return this.create({ client, ctx, refreshToken })
  }

  public async watchIncomingMail() {
    await this._gmail.users.watch({
      userId: 'me',
      requestBody: { topicName: bp.secrets.TOPIC_NAME },
    })
  }

  public async getMyEmail() {
    const profile = await this._gmail.users.getProfile({
      userId: 'me',
    })

    return profile.data.emailAddress
  }

  public async getMyHistory(startHistoryId?: string) {
    const history = await this._gmail.users.history.list({
      startHistoryId,
      historyTypes: ['messageAdded'],
      userId: 'me',
    })

    return history.data
  }

  public async getMessageById(messageId: string) {
    const message = await this._gmail.users.messages.get({ id: messageId, userId: 'me' })

    return message.data
  }

  public async sendRawEmail(raw: string, threadId?: string) {
    const newMail = await this._gmail.users.messages.send({ requestBody: { raw, threadId }, userId: 'me' })

    return newMail.data
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

  private static async _exchangeAuthorizationCodeForRefreshToken(authorizationCode: string) {
    const oauth2Client = this._getOAuthClient()
    const { tokens } = await oauth2Client.getToken({
      code: authorizationCode,
    })

    if (!tokens.refresh_token) {
      throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
    }

    return tokens.refresh_token
  }

  private static _getOAuthClient(): GoogleOAuth2Client {
    return new google.auth.OAuth2(bp.secrets.CLIENT_ID, bp.secrets.CLIENT_SECRET, GLOBAL_OAUTH_ENDPOINT)
  }
}
