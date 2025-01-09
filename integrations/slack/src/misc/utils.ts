import type { Request } from '@botpress/sdk'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import axios from 'axios'
import * as crypto from 'crypto'
import queryString from 'query-string'
import VError from 'verror'
import * as bp from '../../.botpress'
import { Configuration, SyncState } from '../setup'
import { AckFunction, Client, IntegrationCtx, IntegrationLogger, Conversation } from './types'

type InteractiveBody = {
  response_url: string
  actions: {
    action_id?: string
    block_id?: string
    value?: string
    type: string
    selected_option?: { value: string }
  }[]
  type: string
  channel: {
    id: string
  }
  user: {
    id: string
  }
  message: {
    ts: string
  }
}

type SlackMessage = NonNullable<Awaited<ReturnType<WebClient['chat']['postMessage']>>['message']>

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

function getTags(message: SlackMessage) {
  const tags: Record<string, string> = {}

  if (!message.ts) {
    throw Error('No message timestamp found')
  }

  tags.ts = message.ts

  return tags
}

const oauthHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
} as const

export class SlackOauthClient {
  private _clientId: string
  private _clientSecret: string

  public constructor() {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }

  public async getAccessToken(code: string) {
    const res = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      {
        client_id: this._clientId,
        client_secret: this._clientSecret,
        redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
        code,
      },
      {
        headers: oauthHeaders,
      }
    )

    const { access_token } = res.data

    if (!access_token) {
      throw new Error('No access token found')
    }

    return access_token as string
  }
}

export const saveCredentials = async (
  client: Client,
  ctx: IntegrationCtx,
  credentials: bp.states.credentials.Credentials
) => {
  await client.setState({ type: 'integration', name: 'credentials', id: ctx.integrationId, payload: credentials })
}

export async function onOAuth(req: Request, client: bp.Client, ctx: bp.Context) {
  const slackOAuthClient = new SlackOauthClient()

  const query = queryString.parse(req.query)
  const code = query.code

  if (typeof code !== 'string') {
    throw new Error('Handler received an empty code')
  }

  const accessToken = await slackOAuthClient.getAccessToken(code)

  await saveCredentials(client, ctx, { accessToken, signingSecret: bp.secrets.SIGNING_SECRET })

  const slackClient = new WebClient(accessToken)
  const { team } = await slackClient.team.info()

  const teamId = team?.id

  if (!teamId) {
    throw new Error('No team ID found')
  }

  await client.configureIntegration({ identifier: teamId })
}

export const getSlackTarget = (conversation: Conversation) => {
  const channel = conversation.tags.id
  const thread = (conversation.tags as Record<string, string>).thread // TODO: fix cast in SDK typings

  if (!channel) {
    throw Error(`No channel found for conversation ${conversation.id}`)
  }

  return { channel, thread_ts: thread }
}

const isValidUrl = (str: string) => {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

const getOptionalProps = (ctx: IntegrationCtx, logger: IntegrationLogger) => {
  const props = {
    username: ctx.configuration.botName?.trim(),
    icon_url: undefined as string | undefined,
  }

  if (ctx.configuration.botAvatarUrl) {
    if (isValidUrl(ctx.configuration.botAvatarUrl)) {
      props.icon_url = ctx.configuration.botAvatarUrl
    } else {
      logger.forBot().warn('Invalid bot avatar URL')
    }
  }

  return props
}

export async function sendSlackMessage(
  { client, ctx, ack, logger }: { client: Client; ctx: IntegrationCtx; ack: AckFunction; logger: IntegrationLogger },
  payload: ChatPostMessageArguments
) {
  const accessToken = await getAccessToken(client, ctx)
  const slackClient = new WebClient(accessToken)

  const botOptionalProps = getOptionalProps(ctx, logger)

  const response = await slackClient.chat.postMessage({ ...payload, ...botOptionalProps })
  const message = response.message

  if (!(response.ok && message)) {
    throw Error('Error sending message')
  }

  await ack({ tags: getTags(message) })

  return message
}

export const isInteractiveRequest = (req: Request) => {
  // Keeping interactive_path for backward compatibility
  return req.body?.startsWith('payload=') || req.path === '/interactive'
}

export const parseInteractiveBody = (req: Request): InteractiveBody => {
  try {
    return JSON.parse(decodeURIComponent(req.body!).replace('payload=', ''))
  } catch (err) {
    throw new VError('Body is invalid for interactive request', err)
  }
}

export const respondInteractive = async (body: InteractiveBody): Promise<string> => {
  if (!body.actions.length) {
    throw new VError('No action in body')
  }

  const action = body.actions[0]
  const text = action?.value || action?.selected_option?.value || action?.action_id
  if (text === undefined) {
    throw new VError('Action value cannot be undefined')
  }

  try {
    await axios.post(body.response_url, { text })

    return text
  } catch (err: any) {
    throw new VError(err, 'Error while responding to interactive request')
  }
}

export const getBotpressUserFromSlackUser = async (props: { slackUserId: string }, client: Client) => {
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
  client: Client
) => {
  let conversation: Conversation

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

/**
 * @deprecated Use `getBotpressUserFromSlackUser` and `getBotpressConversationFromSlackThread` instead
 */
export const getUserAndConversation = async (
  {
    slackUserId,
    slackChannelId,
    slackThreadId,
  }: {
    slackUserId: string
    slackChannelId: string
    slackThreadId?: string
  },
  client: Client
) => {
  const { botpressUser, botpressUserId } = await getBotpressUserFromSlackUser({ slackUserId }, client)
  const { botpressConversation, botpressConversationId } = await getBotpressConversationFromSlackThread(
    { slackChannelId, slackThreadId },
    client
  )

  return {
    user: botpressUser,
    userId: botpressUserId,
    conversation: botpressConversation,
    conversationId: botpressConversationId,
  }
}

export const getMessageFromSlackEvent = async (
  client: Client,
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

export const getSlackUserProfile = async (botToken: string, slackUserId: string) => {
  const slackClient = new WebClient(botToken)
  const { profile } = await slackClient.users.profile.get({ user: slackUserId })

  return profile
}

export const saveConfig = async (client: Client, ctx: IntegrationCtx, config: Configuration) => {
  await client.setState({ type: 'integration', name: 'configuration', id: ctx.integrationId, payload: config })
}

export const getConfig = async (client: Client, ctx: IntegrationCtx): Promise<Configuration> => {
  const emptyPayload: bp.states.configuration.Configuration = {}

  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId }).catch(() => ({
    state: { payload: emptyPayload },
  }))

  return payload
}

export const saveSyncState = async (client: Client, ctx: IntegrationCtx, state: SyncState) => {
  await client.setState({ type: 'integration', name: 'sync', id: ctx.integrationId, payload: state })
}

export const getSyncState = async (client: Client, ctx: IntegrationCtx): Promise<SyncState> => {
  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'sync', id: ctx.integrationId }).catch(() => ({
    state: { payload: {} as any },
  }))

  return payload as SyncState
}

const getCredentials = async (client: Client, ctx: IntegrationCtx) => {
  const {
    state: { payload: credentials },
  } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })

  return credentials
}

export const getAccessToken = async (client: Client, ctx: IntegrationCtx) => {
  if (ctx.configurationType === 'botToken') {
    return ctx.configuration.botToken
  }

  return (await getCredentials(client, ctx)).accessToken
}

export const getSigningSecret = async (client: Client, ctx: IntegrationCtx) => {
  if (ctx.configurationType === 'botToken') {
    return (await getCredentials(client, ctx)).signingSecret
  }
  return bp.secrets.SIGNING_SECRET
}

export class SlackEventSignatureValidator {
  public constructor(
    private readonly _signingSecret: string,
    private readonly _request: Request,
    private readonly _logger: IntegrationLogger
  ) {}

  public isEventProperlyAuthenticated(): boolean {
    return this._validateHeadersArePresent() && this._validateTimestamp() && this._validateSignature()
  }

  private _validateHeadersArePresent(): boolean {
    const timestamp = this._request.headers['x-slack-request-timestamp']
    const slackSignature = this._request.headers['x-slack-signature']

    if (!timestamp || !slackSignature) {
      this._logger.forBot().error('Request signature verification failed: missing timestamp or signature')
      return false
    }

    return true
  }

  private _validateTimestamp(): boolean {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
    const timestamp = this._request.headers['x-slack-request-timestamp'] as string

    if (parseInt(timestamp) < fiveMinutesAgo) {
      this._logger.forBot().error('Request signature verification failed: timestamp is too old')
      return false
    }

    return true
  }

  private _validateSignature(): boolean {
    const sigBasestring = `v0:${this._request.headers['x-slack-request-timestamp']}:${this._request.body}`
    const mySignature = 'v0=' + crypto.createHmac('sha256', this._signingSecret).update(sigBasestring).digest('hex')

    try {
      return crypto.timingSafeEqual(
        Buffer.from(mySignature, 'utf8'),
        Buffer.from(this._request.headers['x-slack-signature'] as string, 'utf8')
      )
    } catch {
      this._logger.forBot().error('An error occurred while verifying the request signature')
      return false
    }
  }
}

const updateBotpressBotName = async (client: Client, ctx: IntegrationCtx) => {
  const { botName } = ctx.configuration
  const trimmedName = botName?.trim()

  if (trimmedName) {
    await client.updateUser({
      id: ctx.botUserId,
      name: trimmedName,
      tags: {},
    })
  }
}

const updateBotpressBotAvatar = async (client: Client, ctx: IntegrationCtx) => {
  const { botAvatarUrl } = ctx.configuration

  if (botAvatarUrl && isValidUrl(botAvatarUrl)) {
    await client.updateUser({
      id: ctx.botUserId,
      pictureUrl: botAvatarUrl && isValidUrl(botAvatarUrl) ? botAvatarUrl?.trim() : undefined,
      tags: {},
    })
  }
}

export const updateBotpressBotNameAndAvatar = (client: Client, ctx: IntegrationCtx) => {
  return Promise.all([updateBotpressBotName(client, ctx), updateBotpressBotAvatar(client, ctx)])
}
