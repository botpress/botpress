import type { Client, Conversation } from '@botpress/client'
import type { AckFunction, Request } from '@botpress/sdk'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import axios from 'axios'
import VError from 'verror'
import { INTEGRATION_NAME } from '../const'
import { Configuration } from '../setup'
import { IntegrationCtx } from './types'

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

export function onOAuth() {
  return {}
}

export const getSlackTarget = (conversation: Conversation) => {
  const channel = getTag(conversation.tags, 'id')
  const thread = getTag(conversation.tags, 'thread')

  if (!channel) {
    throw Error(`No channel found for conversation ${conversation.id}`)
  }

  return { channel, thread_ts: thread }
}

export async function sendSlackMessage(botToken: string, ack: AckFunction, payload: ChatPostMessageArguments) {
  const client = new WebClient(botToken)
  const response = await client.chat.postMessage(payload)
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

export const getChannelType = (props: { channel: string; thread?: string }) => {
  if (props.thread) {
    return 'thread'
  }

  return props.channel.startsWith('D') ? 'dm' : 'channel'
}

export const getUserAndConversation = async (
  props: { slackUserId: string; slackChannelId: string; slackThreadId?: string },
  client: Client
) => {
  const channelType = getChannelType({ channel: props.slackChannelId, thread: props.slackThreadId })

  const { conversation } = await client.getOrCreateConversation({
    channel: channelType,
    tags: { id: props.slackChannelId, thread: props.slackThreadId! },
  })
  const { user } = await client.getOrCreateUser({ tags: { id: props.slackUserId } })

  return {
    userId: user.id,
    conversationId: conversation.id,
  }
}

export const saveConfig = async (client: Client, ctx: IntegrationCtx, config: Configuration) => {
  await client.setState({ type: 'integration', name: 'configuration', id: ctx.integrationId, payload: config })
}

export const getConfig = async (client: Client, ctx: IntegrationCtx): Promise<Configuration> => {
  const {
    state: { payload },
  } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })

  return payload as Configuration
}
