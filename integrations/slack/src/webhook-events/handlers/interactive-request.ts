import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { getBotpressConversationFromSlackThread, getBotpressUserFromSlackUser } from '../../misc/utils'
import * as bp from '.botpress'

export const isInteractiveRequest = (req: sdk.Request) =>
  req.body?.startsWith('payload=') || req.path === '/interactive'

export const handleInteractiveRequest = async ({ req, client, logger }: bp.HandlerProps) => {
  const body = _parseInteractiveBody(req)

  if (body.type !== 'block_actions') {
    logger.forBot().error(`Interaction type ${body.type} received from Slack is not supported yet`)
    return
  }

  const actionValue = await _respondInteractive(body)

  if (typeof actionValue !== 'string' || !actionValue?.length) {
    logger.forBot().debug('No action value was returned, so the message was ignored')
    return
  }

  const slackChannelId = _getInteractiveSlackChannelId(body)
  const slackMessageTs = _getInteractiveMessageTs(body)

  if (!slackChannelId) {
    throw new sdk.RuntimeError('Slack channel ID is missing from interactive request')
  }

  if (!slackMessageTs) {
    throw new sdk.RuntimeError('Slack message timestamp is missing from interactive request')
  }

  const { botpressUserId: userId } = await getBotpressUserFromSlackUser({ slackUserId: body.user.id }, client)
  const { botpressConversationId: conversationId } = await getBotpressConversationFromSlackThread(
    { slackChannelId, slackThreadId: getInteractiveThreadTs(body) },
    client
  )

  await client.getOrCreateMessage({
    tags: {
      ts: slackMessageTs,
      userId: body.user.id,
      channelId: slackChannelId,
    },
    type: 'text',
    payload: { text: actionValue },
    userId,
    conversationId,
  })
}

type InteractiveBody = {
  response_url?: string
  actions?: {
    action_id?: string
    block_id?: string
    value?: string
    type: string
    selected_option?: { value: string }
  }[]
  type: string
  channel?: {
    id: string
  }
  user: {
    id: string
  }
  container?: {
    channel_id?: string
    message_ts?: string
    thread_ts?: string
  }
  message?: {
    ts?: string
    thread_ts?: string
  }
}

type InteractiveThreadSource = Pick<InteractiveBody, 'container' | 'message'>

export const getInteractiveThreadTs = (body: InteractiveThreadSource): string | undefined =>
  body.container?.thread_ts ?? body.message?.thread_ts

const PAYLOAD_PREFIX = 'payload='

const _stripPayloadPrefixIfPresent = (decoded: string): string =>
  decoded.startsWith(PAYLOAD_PREFIX) ? decoded.slice(PAYLOAD_PREFIX.length) : decoded

const _parseInteractiveBody = (req: sdk.Request): InteractiveBody => {
  try {
    return JSON.parse(_stripPayloadPrefixIfPresent(decodeURIComponent(req.body!)))
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError('Body is invalid for interactive request', error)
  }
}

const _respondInteractive = async (body: InteractiveBody): Promise<string> => {
  if (!body.actions?.length) {
    throw new sdk.RuntimeError('No action in body')
  }

  if (!body.response_url) {
    throw new sdk.RuntimeError('Response URL is missing from interactive request')
  }

  const action = body.actions[0]
  const text = action?.value || action?.selected_option?.value || action?.action_id
  if (text === undefined) {
    throw new sdk.RuntimeError('Action value cannot be undefined')
  }

  try {
    await axios.post(body.response_url, { text })

    return text
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError('Error while responding to interactive request', error)
  }
}

const _getInteractiveSlackChannelId = (body: Pick<InteractiveBody, 'channel' | 'container'>): string | undefined =>
  body.channel?.id ?? body.container?.channel_id

const _getInteractiveMessageTs = (body: Pick<InteractiveBody, 'container' | 'message'>): string | undefined =>
  body.message?.ts ?? body.container?.message_ts
