import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { getBotpressConversationFromSlackThread, getBotpressUserFromSlackUser } from '../../misc/utils'
import * as bp from '.botpress'

export const isInteractiveRequest = (req: sdk.Request) =>
  req.body?.startsWith('payload=') || req.path === '/interactive'

export const handleInteractiveRequest = async ({ req, client, logger }: bp.HandlerProps) => {
  const body = _parseInteractiveBody(req)

  const actionValue = await _respondInteractive(body)

  if (body.type !== 'block_actions') {
    logger.forBot().error(`Interaction type ${body.type} received from Slack is not supported yet`)
    return
  }

  if (typeof actionValue !== 'string' || !actionValue?.length) {
    logger.forBot().debug('No action value was returned, so the message was ignored')
    return
  }

  const { botpressUserId: userId } = await getBotpressUserFromSlackUser({ slackUserId: body.user.id }, client)
  const { botpressConversationId: conversationId } = await getBotpressConversationFromSlackThread(
    { slackChannelId: body.channel.id },
    client
  )

  await client.getOrCreateMessage({
    tags: {
      ts: body.message.ts,
      userId: body.user.id,
      channelId: body.channel.id,
    },
    type: 'text',
    payload: { text: actionValue },
    userId,
    conversationId,
  })
}

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

const _parseInteractiveBody = (req: sdk.Request): InteractiveBody => {
  try {
    return JSON.parse(decodeURIComponent(req.body!).replace('payload=', ''))
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError('Body is invalid for interactive request', error)
  }
}

const _respondInteractive = async (body: InteractiveBody): Promise<string> => {
  if (!body.actions.length) {
    throw new sdk.RuntimeError('No action in body')
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
