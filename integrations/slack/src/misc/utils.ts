import type { Conversation } from '@botpress/client'
import type { AckFunction, IntegrationContext, Request } from '@botpress/sdk'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import axios from 'axios'
import queryString from 'query-string'
import VError from 'verror'
import { INTEGRATION_NAME } from '../const'
import { Configuration, SyncState } from '../setup'
import { Client, IntegrationCtx } from './types'
import * as bp from '.botpress'

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

export const isUserId = (id: string) => id.startsWith('U')

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
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = bp.secrets.CLIENT_ID
    this.clientSecret = bp.secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const res = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
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

export async function onOAuth(req: Request, client: bp.Client, ctx: IntegrationContext) {
  const slackOAuthClient = new SlackOauthClient()

  const query = queryString.parse(req.query)
  const code = query.code

  if (typeof code !== 'string') {
    throw new Error('Handler received an empty code')
  }

  const accessToken = await slackOAuthClient.getAccessToken(code)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      accessToken,
    },
  })

  const slackClient = new WebClient(accessToken)
  const { team } = await slackClient.team.info()

  const teamId = team?.id

  if (!teamId) {
    throw new Error('No team ID found')
  }

  await client.configureIntegration({ identifier: teamId })
}

export const getSlackTarget = (conversation: Conversation) => {
  const channel = getTag(conversation.tags, 'id')
  const thread = getTag(conversation.tags, 'thread')

  if (!channel) {
    throw Error(`No channel found for conversation ${conversation.id}`)
  }

  return { channel, thread_ts: thread }
}

export async function sendSlackMessage(
  { client, ctx, ack }: { client: Client; ctx: IntegrationCtx; ack: AckFunction },
  payload: ChatPostMessageArguments
) {
  const accessToken = await getAccessToken(client, ctx)
  const slackClient = new WebClient(accessToken)

  const botOptionalProps = {
    icon_url: ctx.configuration.botAvatarUrl,
    username: ctx.configuration.botName,
  }

  const response = await slackClient.chat.postMessage({ ...payload, ...botOptionalProps })
  const message = response.message

  if (!(response.ok && message)) {
    throw Error('Error sending message')
  }

  await ack({ tags: getTags(message) })

  return message
}

export const getDirectMessageForUser = async (userId: string, botToken: string) => {
  const client = new WebClient(botToken)
  const conversation = await client.conversations.open({ users: userId })

  return conversation.channel?.id
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

export const getTag = (tags: Record<string, string>, name: string) => {
  return tags[`${INTEGRATION_NAME}:${name}`]
}

export const getUserAndConversation = async (
  props: {
    slackUserId: string
    slackChannelId: string
    slackThreadId?: string
  },
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

  const { user } = await client.getOrCreateUser({
    tags: { id: props.slackUserId },
  })

  return {
    user,
    userId: user.id,
    conversationId: conversation.id,
  }
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
  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId }).catch(() => ({
    state: { payload: {} as any },
  }))

  return payload as Configuration
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

export const getAccessToken = async (client: Client, ctx: IntegrationCtx) => {
  if (ctx.configuration.botToken) {
    return ctx.configuration.botToken
  }

  const { state } = await client
    .getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    .catch(() => ({
      state: { payload: {} as any },
    }))

  return state.payload.accessToken
}
