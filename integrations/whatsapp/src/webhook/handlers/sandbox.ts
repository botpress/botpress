import {
  CONVERSATION_CONNECTED_MESSAGE,
  CONVERSATION_DISCONNECTED_MESSAGE,
  extractSandboxCommand,
} from '@botpress/common'
import { getAuthenticatedWhatsappClient } from 'src/auth'
import { WhatsAppPayloadSchema, WhatsAppMessageValue } from 'src/misc/types'
import { Text } from 'whatsapp-api-js/messages'
import * as bp from '.botpress'

export const isSandboxCommand = (props: bp.HandlerProps): boolean => {
  const { req } = props
  return extractSandboxCommand(req) !== undefined
}

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
  const { client, ctx } = props
  const value = _extractValueFromRequest(props)
  const message = value?.messages?.[0]
  if (!message) {
    return NO_MESSAGE_ERROR
  }

  const userPhoneNumber = message.from
  const botPhoneNumberId = value.metadata.phone_number_id
  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)

  await whatsapp.markAsRead(botPhoneNumberId, message.id, 'text')
  await whatsapp.sendMessage(botPhoneNumberId, userPhoneNumber, new Text(CONVERSATION_CONNECTED_MESSAGE))
  return
}

const _handleLeaveCommand = async (props: bp.HandlerProps) => {
  const { client, ctx } = props
  const value = _extractValueFromRequest(props)
  const message = value?.messages?.[0]
  if (!message) {
    return NO_MESSAGE_ERROR
  }

  const userPhoneNumber = message.from
  const botPhoneNumberId = value.metadata.phone_number_id
  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)

  await whatsapp.markAsRead(botPhoneNumberId, message.id, 'text')
  await whatsapp.sendMessage(botPhoneNumberId, userPhoneNumber, new Text(CONVERSATION_DISCONNECTED_MESSAGE))
  return
}

const _extractValueFromRequest = (props: bp.HandlerProps): WhatsAppMessageValue | undefined => {
  const { req, logger } = props
  if (!req.body) {
    return undefined
  }

  try {
    const data = JSON.parse(req.body)
    const payload = WhatsAppPayloadSchema.parse(data)
    return payload.entry[0]?.changes[0]?.field === 'messages' ? payload.entry[0]?.changes[0]?.value : undefined
  } catch (e: any) {
    logger.error('Error while extracting message from request:', e?.message ?? '[unknown error]')
    return undefined
  }
}
