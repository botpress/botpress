import {
  CONVERSATION_CONNECTED_MESSAGE,
  CONVERSATION_DISCONNECTED_MESSAGE,
  extractSandboxCommand,
} from '@botpress/common'
import { getCredentials, InstagramClient } from 'src/misc/client'
import { InstagramMessagingEntry, InstagramPayloadSchema } from 'src/misc/types'
import * as bp from '.botpress'

const NO_MESSAGE_ERROR = { status: 400, body: 'No message found in request' } as const

export const sandboxHandler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { req } = props
  const command = extractSandboxCommand(req)
  if (!command) {
    return { status: 400, body: 'No sandbox command to handle' }
  }

  if (command === 'join') {
    return await _handleJoinCommand(props)
  } else if (command === 'leave') {
    return await _handleLeaveCommand(props)
  }
  return
}

const _handleJoinCommand = async (props: bp.HandlerProps) => {
  const { client, ctx, logger } = props
  const messagingEntry = _extractMessagingEntryFromRequest(props)
  if (!messagingEntry) {
    return NO_MESSAGE_ERROR
  }

  const { accessToken, instagramId } = await getCredentials(client, ctx)
  const metaClient = new InstagramClient(logger, { accessToken, instagramId })
  await metaClient.sendTextMessage(messagingEntry.sender.id, CONVERSATION_CONNECTED_MESSAGE)
  return
}

const _handleLeaveCommand = async (props: bp.HandlerProps) => {
  const { client, ctx, logger } = props
  const messagingEntry = _extractMessagingEntryFromRequest(props)
  if (!messagingEntry) {
    return NO_MESSAGE_ERROR
  }
  const { accessToken, instagramId } = await getCredentials(client, ctx)
  const metaClient = new InstagramClient(logger, { accessToken, instagramId })
  await metaClient.sendTextMessage(messagingEntry.sender.id, CONVERSATION_DISCONNECTED_MESSAGE)
  return
}

const _extractMessagingEntryFromRequest = (props: bp.HandlerProps): InstagramMessagingEntry | undefined => {
  const { req, logger } = props
  if (!req.body) {
    return undefined
  }

  try {
    const data = JSON.parse(req.body)
    const payload = InstagramPayloadSchema.parse(data)
    return payload.entry[0]?.messaging[0]
  } catch (e: any) {
    logger.error('Error while extracting message from request:', e?.message ?? '[unknown error]')
    return undefined
  }
}
