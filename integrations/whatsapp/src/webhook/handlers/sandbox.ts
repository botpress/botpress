import { z } from '@botpress/sdk'
import { getAuthenticatedWhatsappClient } from 'src/auth'
import { WhatsAppPayloadSchema, WhatsAppValue } from 'src/misc/types'
import { Text } from 'whatsapp-api-js/messages'
import * as bp from '.botpress'

const supportedDynamicLinkingCommandsSchema = z.enum(['join', 'leave'])
type SupportedDynamicLinkingCommand = z.infer<typeof supportedDynamicLinkingCommandsSchema>

export const isSandboxCommand = (props: bp.HandlerProps): boolean => {
  const { req } = props
  return extractSandboxCommand(req) !== undefined
}

const NO_MESSAGE_ERROR = { status: 400, body: 'No message found in request' } as const

const extractSandboxCommand = (req: bp.HandlerProps['req']): SupportedDynamicLinkingCommand | undefined => {
  const operation = req.headers['x-bp-sandbox-operation']
  if (!operation) {
    return undefined
  }
  const operationParseResult = supportedDynamicLinkingCommandsSchema.safeParse(operation)
  if (!operationParseResult.success) {
    return undefined
  }
  return operationParseResult.data
}

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
  await whatsapp.sendMessage(
    botPhoneNumberId,
    userPhoneNumber,
    new Text('Conversation connected to bot. You can now send messages. To disconnect, send this message: //leave')
  )
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
  await whatsapp.sendMessage(botPhoneNumberId, userPhoneNumber, new Text('Conversation disconnected from bot'))
  return
}

const _extractValueFromRequest = (props: bp.HandlerProps): WhatsAppValue | undefined => {
  const { req, logger } = props
  if (!req.body) {
    return undefined
  }

  try {
    const data = JSON.parse(req.body)
    const payload = WhatsAppPayloadSchema.parse(data)
    return payload.entry[0]?.changes[0]?.value
  } catch (e: any) {
    logger.error('Error while extracting message from request:', e?.message ?? '[unknown error]')
    return undefined
  }
}
