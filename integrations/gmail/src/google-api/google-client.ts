import * as sdk from '@botpress/sdk'
import { gmail_v1, google } from 'googleapis'
import { IntegrationConfig } from 'src/config/integration-config'
import { composeRawEmail } from 'src/utils/mail-composing'
import { GmailClient, GoogleOAuth2Client } from './types'
import * as bp from '.botpress'

export class GoogleClient {
  public readonly threads: ThreadManagement
  public readonly messages: MessageManagement
  public readonly labels: LabelManagement
  public readonly drafts: DraftManagement

  private constructor(
    private readonly _gmail: GmailClient,
    private readonly _topicName: string
  ) {
    this.threads = new ThreadManagement(this._gmail)
    this.messages = new MessageManagement(this._gmail)
    this.labels = new LabelManagement(this._gmail)
    this.drafts = new DraftManagement(this._gmail)
  }

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

  public async watchIncomingMail() {
    await this._gmail.users.watch({
      userId: 'me',
      requestBody: { topicName: this._topicName },
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

class MessageManagement {
  public constructor(private readonly _gmail: GmailClient) {}

  public async get(messageId: string) {
    const message = await this._gmail.users.messages.get({ id: messageId, userId: 'me' })
    return message.data
  }

  public async send(raw: string, threadId?: string) {
    const newMail = await this._gmail.users.messages.send({ requestBody: { raw, threadId }, userId: 'me' })
    return newMail.data
  }

  public async delete(messageId: string) {
    await this._gmail.users.messages.delete({ id: messageId, userId: 'me' })
  }

  public async trash(messageId: string) {
    await this._gmail.users.messages.trash({ id: messageId, userId: 'me' })
  }

  public async untrash(messageId: string) {
    await this._gmail.users.messages.untrash({ id: messageId, userId: 'me' })
  }

  public async modifyLabels(messageId: string, addLabelIds?: string[], removeLabelIds?: string[]) {
    await this._gmail.users.messages.modify({
      id: messageId,
      userId: 'me',
      requestBody: { addLabelIds, removeLabelIds },
    })
  }

  public async getAttachment(messageId?: string, attachmentId?: string) {
    const attachment = await this._gmail.users.messages.attachments.get({ id: attachmentId, messageId, userId: 'me' })
    return attachment.data
  }

  public async getFirstAttachment(messageId: string) {
    const message = await this.get(messageId)
    const attachmentId = this._findFirstAttachmentId(message.payload)

    if (!attachmentId) {
      throw new sdk.RuntimeError('No attachment found in the message')
    }

    const attachment = await this._gmail.users.messages.attachments.get({
      id: attachmentId,
      messageId,
      userId: 'me',
    })

    return {
      ...attachment.data,
      attachmentId,
    }
  }

  public async composeRaw(to: string, subject: string, body: string) {
    const raw = await composeRawEmail({
      to,
      subject,
      text: body,
      html: body,
      textEncoding: 'base64',
    })

    return raw
  }

  private _findFirstAttachmentId(payload: gmail_v1.Schema$MessagePart | undefined): string | null {
    if (!payload) {
      return null
    }

    if (payload.body?.attachmentId) {
      return payload.body.attachmentId
    }

    if (payload.parts && Array.isArray(payload.parts)) {
      for (const part of payload.parts) {
        const attachmentId = this._findFirstAttachmentId(part)
        if (attachmentId) {
          return attachmentId
        }
      }
    }

    return null
  }
}

class ThreadManagement {
  public constructor(private readonly _gmail: GmailClient) {}

  public async list() {
    const threads = await this._gmail.users.threads.list({ userId: 'me' })
    return threads.data
  }

  public async get(threadId: string) {
    const thread = await this._gmail.users.threads.get({ id: threadId, userId: 'me' })
    return thread.data
  }

  public async trash(threadId: string) {
    await this._gmail.users.threads.trash({ id: threadId, userId: 'me' })
  }

  public async untrash(threadId: string) {
    await this._gmail.users.threads.untrash({ id: threadId, userId: 'me' })
  }
}

class LabelManagement {
  public constructor(private readonly _gmail: GmailClient) {}

  public async list() {
    const labels = await this._gmail.users.labels.list({ userId: 'me' })
    return labels.data
  }

  public async get(labelId: string) {
    const label = await this._gmail.users.labels.get({ id: labelId, userId: 'me' })
    return label.data
  }

  public async create(name: string) {
    const label = await this._gmail.users.labels.create({ requestBody: { name }, userId: 'me' })
    return label.data
  }

  public async delete(labelId: string) {
    await this._gmail.users.labels.delete({ id: labelId, userId: 'me' })
  }

  public async update(labelId: string, name?: string, backgroundColor?: string, textColor?: string) {
    const label = await this._gmail.users.labels.update({
      id: labelId,
      userId: 'me',
      requestBody: {
        name,
        color: backgroundColor || textColor ? { backgroundColor, textColor } : undefined,
      },
    })
    return label.data
  }
}

class DraftManagement {
  public constructor(private readonly _gmail: GmailClient) {}

  public async list() {
    const drafts = await this._gmail.users.drafts.list({ userId: 'me' })
    return drafts.data
  }

  public async get(draftId: string) {
    const draft = await this._gmail.users.drafts.get({ id: draftId, userId: 'me' })
    return draft.data
  }

  public async create(raw: string) {
    const draft = await this._gmail.users.drafts.create({
      userId: 'me',
      requestBody: { message: { raw } },
    })
    return draft.data
  }

  public async delete(draftId: string) {
    await this._gmail.users.drafts.delete({ id: draftId, userId: 'me' })
  }

  public async update(draftId: string, raw: string) {
    const draft = await this._gmail.users.drafts.update({
      id: draftId,
      userId: 'me',
      requestBody: { message: { raw } },
    })
    return draft.data
  }

  public async send(draftId: string) {
    const sent = await this._gmail.users.drafts.send({
      userId: 'me',
      requestBody: { id: draftId },
    })
    return sent.data
  }
}
