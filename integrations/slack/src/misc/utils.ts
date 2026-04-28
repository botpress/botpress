import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { SlackClient } from 'src/slack-api'
import * as bp from '.botpress'

const _extractBotpressFileId = (url: string): string | undefined => {
  try {
    const pathname = new URL(url).pathname
    const last = pathname.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last) : undefined
  } catch {
    return undefined
  }
}

export const downloadBotpressFile = async (
  url: string,
  client: bp.Client,
  logger: bp.Logger
): Promise<{ buffer: Buffer; filename: string }> => {
  let downloadUrl = url
  let filename = _extractBotpressFileId(url) ?? 'file'

  const fileId = _extractBotpressFileId(url)
  if (fileId) {
    try {
      const { file } = await client.getFile({ id: fileId })
      downloadUrl = file.url
      filename = file.key.split('/').pop() ?? filename
    } catch (error) {
      logger
        .forBot()
        .debug('Could not resolve file through Botpress Files API, falling back to direct URL download', { error })
    }
  }

  try {
    const response = await axios.get<ArrayBuffer>(downloadUrl, { responseType: 'arraybuffer' })
    return { buffer: Buffer.from(response.data), filename }
  } catch (error) {
    logger.forBot().error('Error while downloading file from URL:', error)
    throw new RuntimeError(error instanceof Error ? error.message : String(error))
  }
}

export const isValidUrl = (str: string) => {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export const getBotpressUserFromSlackUser = async (props: { slackUserId: string }, client: bp.Client) => {
  const { user } = await client.getOrCreateUser({
    tags: { id: props.slackUserId },
  })

  return {
    botpressUser: user,
    botpressUserId: user.id,
  }
}

export const updateBotpressUserFromSlackUser = async (
  slackUserId: string,
  botpressUser: Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user'],
  client: bp.Client,
  ctx: bp.Context,
  logger: bp.Logger
) => {
  if (botpressUser.pictureUrl && botpressUser.name) {
    return
  }

  try {
    const slackClient = await SlackClient.createFromStates({ ctx, client, logger })
    const userProfile = await slackClient.getUserProfile({ userId: slackUserId })
    const fieldsToUpdate = {
      pictureUrl: userProfile?.image_192,
      name: userProfile?.real_name,
    }
    logger.forBot().debug('Fetched latest Slack user profile: ', fieldsToUpdate)
    if (fieldsToUpdate.pictureUrl || fieldsToUpdate.name) {
      await client.updateUser({ ...botpressUser, ...fieldsToUpdate })
    }
  } catch (error) {
    logger.forBot().error('Error while fetching user profile from Slack:', error)
  }
}

export const getBotpressConversationFromSlackThread = async (
  props: { slackChannelId: string; slackThreadId?: string },
  client: bp.Client
) => {
  let conversation: bp.ClientResponses['getConversation']['conversation']

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

export const getMessageFromSlackEvent = async (
  client: bp.Client,
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

export const safeParseBody = (body: string) => {
  const parseResult = _safeParseJson(body)
  return parseResult.success ? parseResult : _safeDecodeURIComponent(body)
}

const _safeDecodeURIComponent = (component: string) => {
  try {
    const decoded = decodeURIComponent(component)
    return _safeParseJson(decoded.startsWith('payload=') ? decoded.slice('payload='.length) : decoded)
  } catch (thrown: unknown) {
    return {
      success: false,
      error: thrown instanceof Error ? thrown : new Error(String(thrown)),
    }
  }
}

const _safeParseJson = (json: string) => {
  try {
    return {
      success: true,
      data: JSON.parse(json),
    }
  } catch (thrown: unknown) {
    return {
      success: false,
      error: thrown instanceof Error ? thrown : new Error(String(thrown)),
    }
  }
}
