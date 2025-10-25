import {
  CONVERSATION_CONNECTED_MESSAGE,
  CONVERSATION_DISCONNECTED_MESSAGE,
  extractSandboxCommand,
} from '@botpress/common'
import { createAuthenticatedMessengerClient } from '../../misc/messenger-client'
import { MessengerMessagingItem, eventPayloadSchema } from '../../misc/types'
import { getErrorFromUnknown } from '../../misc/utils'
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
  const messagingItem = _extractMessagingItemFromRequest(props)
  if (!messagingItem) {
    return NO_MESSAGE_ERROR
  }
  const messengerClient = await createAuthenticatedMessengerClient(client, ctx)
  for (const action of ['typing_on', 'mark_seen'] as const) {
    await messengerClient.sendSenderAction(messagingItem.sender.id, action)
  }
  await messengerClient.sendText(messagingItem.sender.id, message)
  return
}

const _extractMessagingItemFromRequest = (props: bp.HandlerProps): MessengerMessagingItem | undefined => {
  const { req, logger } = props
  if (!req.body) {
    return undefined
  }

  try {
    const data = JSON.parse(req.body)
    const payload = eventPayloadSchema.parse(data)
    const entry = payload.entry[0]
    if (!entry) {
      logger.error('No entry found in payload')
      return undefined
    }

    if (!('messaging' in entry)) {
      logger.error('No messaging found in entry')
      return undefined
    }

    return entry.messaging[0]
  } catch (error) {
    logger.error('Error while extracting message from request:', getErrorFromUnknown(error).message)
    return undefined
  }
}
