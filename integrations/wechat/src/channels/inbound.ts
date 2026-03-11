import { XMLParser } from 'fast-xml-parser'
import camelCase from 'lodash/camelCase'
import { Result } from '../types'
import { usePromiseToResult } from '../utils'
import { WeChatMessage, wechatMessageSchema } from './schemas'
import { BaseMessage, createChannelMessage, createMediaMessage } from './utils'
import * as bp from '.botpress'

export type BotpressConversation = Awaited<ReturnType<bp.Client['getOrCreateConversation']>>['conversation']
export type BotpressUser = Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user']

export const processInboundChannelMessage = async (props: bp.HandlerProps): Promise<Result<string>> => {
  const { client, req } = props

  const requestBody = req.body?.trim() || ''
  if (requestBody === '') {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const parseResult = _parseAndValidateMessage(requestBody, props.logger)
  if (!parseResult.success) return parseResult

  const wechatMessage: WeChatMessage = parseResult.data
  // Yes, the WeChat sendMessage request uses the username as the DM conversation identifier
  const wechatConversationId = wechatMessage.fromUserName
  const wechatUserId = wechatMessage.fromUserName

  const convResult = await client
    .getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: wechatConversationId,
        fromUserId: wechatUserId,
        chatId: wechatConversationId,
      },
      discriminateByTags: ['id'],
    })
    .then(...usePromiseToResult('Failed to create Botpress Conversation'))
  if (!convResult.success) return convResult
  const { conversation } = convResult.data

  const userResult = await client
    .getOrCreateUser({
      tags: {
        id: wechatUserId,
      },
      discriminateByTags: ['id'],
    })
    .then(...usePromiseToResult('Failed to create Botpress User'))
  if (!userResult.success) return userResult
  const { user } = userResult.data

  const messageId = wechatMessage.msgId
  const baseMessage = {
    tags: {
      id: messageId,
      chatId: wechatConversationId,
    },
    userId: user.id,
    conversationId: conversation.id,
  } satisfies BaseMessage

  try {
    switch (wechatMessage.msgType) {
      case 'text':
        if (wechatMessage.content) {
          await createChannelMessage(client, baseMessage, 'text', { text: wechatMessage.content })
        }
        break
      case 'image':
      case 'video':
        const mediaMessage = { ...wechatMessage, msgType: wechatMessage.msgType }
        await createMediaMessage(props, baseMessage, messageId, mediaMessage)
        break
      case 'voice':
        if (wechatMessage.mediaId) {
          const voiceText = `[Voice Message] MediaId: ${wechatMessage.mediaId}${wechatMessage.recognition ? `\nRecognized: ${wechatMessage.recognition}` : ''}`
          await createChannelMessage(client, baseMessage, 'text', { text: voiceText })
        }
        break
      case 'location':
        const locationText = `[Location] ${wechatMessage.label || 'location'}\nCoordinates: (${wechatMessage.locationX || '0'}, ${wechatMessage.locationY || '0'})`
        await createChannelMessage(client, baseMessage, 'text', { text: locationText })
        break
      case 'link':
        const linkText = `[Link] ${wechatMessage.title || 'Untitled'}\n${wechatMessage.description || ''}\nURL: ${wechatMessage.url || ''}`
        await createChannelMessage(client, baseMessage, 'text', { text: linkText })
        break
      default:
        return { success: false, error: new Error(`Unsupported message type: ${wechatMessage.msgType}`) }
    }
  } catch (thrown: unknown) {
    const errMessage = thrown instanceof Error ? thrown.message : String(thrown)
    return {
      success: false,
      error: new Error(`Failed to process '${wechatMessage.msgType}' message -> ${errMessage}`),
    }
  }

  return { success: true, data: 'success' }
}

const _parseAndValidateWeChatXmlMessage = (rawXmlContent: string): Result<WeChatMessage> => {
  const parser = new XMLParser({ parseTagValue: false })
  const parseData = _mapWechatMessageKeys(parser.parse(rawXmlContent))
  const result = wechatMessageSchema.safeParse(parseData)

  if (!result.success) {
    return {
      success: false,
      error: new Error(`Unexpected WeChat message body received -> ${result.error.message}`),
    }
  }

  return result
}

// This abstraction can be removed once we determine the "fallback" to no longer be necessary
const _parseAndValidateMessage = (rawXmlContent: string, logger: bp.Logger) => {
  const result = _parseAndValidateWeChatXmlMessage(rawXmlContent)

  if (!result.success) {
    const fbResult = _fallbackParseAndValidateWeChatMessage(rawXmlContent)
    if (fbResult.success) {
      logger.error(`Primary message parser failure, fallback used -> ${result.error.message}`)
      return fbResult
    }

    return result
  }

  return result
}

const _mapWechatMessageKeys = (parsedWechatMessage: Record<string, any>): Record<string, any> => {
  const mappedEntries = Object.entries(parsedWechatMessage).map(([key, value]) => {
    const mappedKey = camelCase(key)
    if (typeof value === 'object' && !Array.isArray(value)) {
      return [mappedKey, _mapWechatMessageKeys(value)] as const
    }

    return [mappedKey, value] as const
  })
  return Object.fromEntries(mappedEntries)
}

/** Tightly coupled to "_fallbackParseAndValidateWeChatMessage" */
const _extractXmlValue = (xml: string, tag: string): string | undefined => {
  // find pattern of CDATA or plain text: <Tag><![CDATA[value]]></Tag> or <Tag>value</Tag>
  const valueRegex = new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${tag}>`, 'i')
  const match = xml.match(valueRegex)
  return match?.[1]
}

// This is a fallback parser, it can be removed once we're sufficiently confident
// that "_parseAndValidateWeChatXmlMessage" works in all expected use-cases.
const _fallbackParseAndValidateWeChatMessage = (reqBody: string): Result<WeChatMessage> => {
  const _wechatMessageKeys = [
    'MsgId',
    'MsgType',
    'ToUserName',
    'FromUserName',
    'Content',
    'PicUrl',
    'MediaId',
    'Recognition',
    'Location_X',
    'Location_Y',
    'Label',
    'Title',
    'Description',
    'Url',
    'CreateTime',
  ]

  const entries = _wechatMessageKeys.map((key) => [camelCase(key), _extractXmlValue(reqBody, key)])
  const result = wechatMessageSchema.safeParse(Object.fromEntries(entries))

  if (!result.success) {
    return { success: false, error: new Error(`Unexpected WeChat Message Body received -> ${result.error.message}`) }
  }

  return result
}
