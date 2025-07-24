import {
  CONVERSATION_CONNECTED_MESSAGE,
  CONVERSATION_DISCONNECTED_MESSAGE,
  extractSandboxCommand,
} from '@botpress/common'
import { create as createMessengerClient } from '../../misc/messenger-client'
import { MessengerMessagingEntry, messengerPayloadSchema } from '../../misc/types'
import * as bp from '.botpress'

const NO_MESSAGE_ERROR = { status: 400, body: 'No message found in request' } as const

export const handler = async (props: bp.HandlerProps) => {
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
  return await _sendConfirmationMessage(props, CONVERSATION_CONNECTED_MESSAGE)
}

const _handleLeaveCommand = async (props: bp.HandlerProps) => {
  return await _sendConfirmationMessage(props, CONVERSATION_DISCONNECTED_MESSAGE)
}

const _sendConfirmationMessage = async (props: bp.HandlerProps, message: string) => {
  const { client, ctx } = props
  const messagingEntry = _extractMessagingEntryFromRequest(props)
  if (!messagingEntry) {
    return NO_MESSAGE_ERROR
  }
  const messengerClient = await createMessengerClient(client, ctx)
  for (const action of ['typing_on', 'mark_seen'] as const) {
    await messengerClient.sendSenderAction(messagingEntry.sender.id, action)
  }
  await messengerClient.sendText(messagingEntry.sender.id, message)
  return
}

const _extractMessagingEntryFromRequest = (props: bp.HandlerProps): MessengerMessagingEntry | undefined => {
  const { req, logger } = props
  if (!req.body) {
    return undefined
  }

  try {
    const data = JSON.parse(req.body)
    const payload = messengerPayloadSchema.parse(data)
    return payload.entry[0]?.messaging[0]
  } catch (e: any) {
    logger.error('Error while extracting message from request:', e?.message ?? '[unknown error]')
    return undefined
  }
}
