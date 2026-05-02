import { RuntimeError } from '@botpress/client'
import { posthogHelper } from '@botpress/common'
import { ValueOf } from '@botpress/sdk/dist/utils/type-utils'
import axios from 'axios'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { getAccessToken, getAuthenticatedWhatsappClient } from '../../auth'
import { safeFormatPhoneNumber } from '../../misc/phone-number-to-whatsapp'
import { WhatsAppMessage, WhatsAppMessageValue } from '../../misc/types'
import { getMessageFromWhatsappMessageId } from '../../misc/util'
import { getMediaInfos } from '../../misc/whatsapp-utils'
import * as bp from '.botpress'

type IncomingMessages = {
  [TMessage in keyof bp.channels.channel.Messages]: {
    type: TMessage
    payload: bp.channels.channel.Messages[TMessage]
  }
}

type CreateMessageArgs = ValueOf<IncomingMessages> & { incomingMessageType?: string }
type CreateMessageFn = (args: CreateMessageArgs) => Promise<{ message: { id: string } } | undefined>

export type HandleMessageArgs = {
  message: WhatsAppMessage
  conversationId: string
  userId: string
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  tags: Record<string, string>
  origin?: 'synthetic'
  createMessageOverride?: CreateMessageFn
}

export const messagesHandler = async (
  message: NonNullable<WhatsAppMessageValue['messages']>[number],
  value: WhatsAppMessageValue,
  props: bp.HandlerProps
) => {
  const { ctx, client, logger } = props

  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const phoneNumberId = value.metadata.phone_number_id
  await whatsapp.markAsRead(phoneNumberId, message.id)

  const formatPhoneNumberResponse = safeFormatPhoneNumber(message.from)
  if (formatPhoneNumberResponse.success === false) {
    const distinctId = formatPhoneNumberResponse.error.id
    await posthogHelper.sendPosthogEvent(
      {
        distinctId: distinctId ?? 'no id',
        event: 'invalid_phone_number',
        properties: {
          from: 'handler',
          phoneNumber: message.from,
        },
      },
      { integrationName: INTEGRATION_NAME, integrationVersion: INTEGRATION_VERSION, key: bp.secrets.POSTHOG_KEY }
    )
    const errorMessage = formatPhoneNumberResponse.error.message
    logger.error(`Failed to parse phone number "${message.from}": ${errorMessage}`)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      userPhone: formatPhoneNumberResponse.success ? formatPhoneNumberResponse.phoneNumber : message.from,
      botPhoneNumberId: value.metadata.phone_number_id,
    },
  })

  const { contacts } = value
  const contact = contacts?.[0]
  if (!contact) {
    logger.forBot().warn('No contacts found, ignoring message')
    return
  }
  const { user } = await client.getOrCreateUser({
    tags: {
      userId: contact.wa_id,
      name: contact.profile?.name,
    },
    name: contact.profile?.name,
    discriminateByTags: ['userId'],
  })

  const replyToWhatsAppId = message.context?.id
  const replyToMessage = replyToWhatsAppId
    ? await getMessageFromWhatsappMessageId(replyToWhatsAppId, client)
    : undefined
  if (replyToWhatsAppId && !replyToMessage) {
    // Only thing we can do is log
    // We can't fetch a message from the API if we didn't receive it on the webhook
    logger
      .forBot()
      .warn(
        `No Botpress message was found for the referenced message with WhatsApp message ID ${replyToWhatsAppId}. The bot may not be able to retrieve the context.`
      )
  }
  const replyTo = replyToMessage?.id

  await _handleMessage({
    message,
    conversationId: conversation.id,
    userId: user.id,
    ctx,
    client,
    logger,
    tags: {
      id: message.id,
      ...(replyTo && { replyTo }),
      ..._processReferralTags(message, logger),
    },
  })
}

export async function _handleMessage(args: HandleMessageArgs) {
  const { message, conversationId, userId, ctx, client, logger, tags, origin } = args

  const _createMessage: CreateMessageFn =
    args.createMessageOverride ??
    (async ({ type, payload, incomingMessageType }) => {
      logger.forBot().debug(`Received ${incomingMessageType ?? type} message from WhatsApp:`, payload)
      return client.getOrCreateMessage({
        tags,
        type,
        payload,
        userId,
        conversationId,
        discriminateByTags: ['id'],
        origin,
      })
    })

  const { type } = message
  if (type === 'text') {
    return _createMessage({ type, payload: { text: message.text.body } })
  } else if (type === 'button') {
    return _createMessage({
      type: 'text',
      payload: {
        value: message.button.payload,
        text: message.button.text,
      },
    })
  } else if (type === 'location') {
    const { latitude, longitude, address, name } = message.location
    return _createMessage({
      type,
      payload: { latitude: Number(latitude), longitude: Number(longitude), title: name, address },
    })
  } else if (type === 'image') {
    const imageUrl = await _getOrDownloadWhatsappMedia(message.image.id, client, ctx)
    return _createMessage({
      type,
      payload: {
        imageUrl,
        ...(message.image.caption && { caption: message.image.caption }),
      },
    })
  } else if (type === 'sticker') {
    const stickerUrl = await _getOrDownloadWhatsappMedia(message.sticker.id, client, ctx)
    return _createMessage({ type: 'image', payload: { imageUrl: stickerUrl } })
  } else if (type === 'audio') {
    const audioUrl = await _getOrDownloadWhatsappMedia(message.audio.id, client, ctx)
    return _createMessage({ type, payload: { audioUrl } })
  } else if (type === 'document') {
    const documentUrl = await _getOrDownloadWhatsappMedia(message.document.id, client, ctx)
    return _createMessage({
      type: 'file',
      payload: { fileUrl: documentUrl, filename: message.document.filename },
    })
  } else if (type === 'video') {
    const videoUrl = await _getOrDownloadWhatsappMedia(message.video.id, client, ctx)
    return _createMessage({ type, payload: { videoUrl } })
  } else if (message.type === 'interactive') {
    if (message.interactive.type === 'button_reply') {
      const { id: value, title: text } = message.interactive.button_reply
      return _createMessage({
        type: 'text',
        payload: { value, text },
        incomingMessageType: type,
      })
    } else if (message.interactive.type === 'list_reply') {
      const { id: value, title: text } = message.interactive.list_reply
      return _createMessage({
        type: 'text',
        payload: { value, text },
        incomingMessageType: type,
      })
    }
  } else if (message.type === 'order') {
    return _createMessage({
      type: 'text',
      payload: { text: JSON.stringify(message.order) },
      incomingMessageType: 'order',
    })
  } else if (message.type === 'unsupported' || message.type === 'unknown') {
    const errors = message.errors?.map((err) => `${err.message} (${err.error_data.details})`).join('\n')
    logger.forBot().warn(`Received message type ${message.type} by WhatsApp, errors: ${errors ?? 'none'}`)
  } else {
    logger.forBot().warn(`Unhandled message type ${type}: ${JSON.stringify(message)}`)
  }
  return undefined
}

async function _getOrDownloadWhatsappMedia(whatsappMediaId: string, client: bp.Client, ctx: bp.Context) {
  if (ctx.configuration.downloadMedia) {
    return await _downloadWhatsappMedia(whatsappMediaId, client, ctx)
  } else {
    const { url } = await getMediaInfos(whatsappMediaId, client, ctx)
    return url
  }
}

async function _downloadWhatsappMedia(whatsappMediaId: string, client: bp.Client, ctx: bp.Context) {
  const { url, mimeType, fileSize } = await getMediaInfos(whatsappMediaId, client, ctx)
  const { file } = await client.upsertFile({
    key: 'whatsapp-media_' + whatsappMediaId,
    expiresAt: _getMediaExpiry(ctx),
    contentType: mimeType,
    accessPolicies: ['public_content'],
    publicContentImmediatelyAccessible: true,
    size: fileSize,
    tags: {
      source: 'integration',
      integration: 'whatsapp',
      channel: 'channel',
      whatsappMediaId,
    },
  })

  const downloadResponse = await axios
    .get(url, {
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${await getAccessToken(client, ctx)}`,
      },
    })
    .catch((err) => {
      throw new RuntimeError(`Failed to download media: ${err.message}`)
    })

  await axios
    .put(file.uploadUrl, downloadResponse.data, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'x-amz-tagging': 'public=true',
      },
      maxBodyLength: fileSize,
    })
    .catch((err) => {
      throw new RuntimeError(`Failed to upload media: ${err.message}`)
    })

  return file.url
}

function _getMediaExpiry(ctx: bp.Context) {
  const expiryDelayHours = ctx.configuration.downloadedMediaExpiry || 0
  if (expiryDelayHours === 0) {
    return undefined
  }
  const expiresAt = new Date(Date.now() + expiryDelayHours * 60 * 60 * 1000)
  return expiresAt.toISOString()
}

function _processReferralTags(message: WhatsAppMessage, logger: bp.Logger): Record<string, string> {
  const { referral } = message
  if (!referral) {
    return {}
  }

  const tags: Record<string, string> = {}

  if (referral.source_url) {
    const originalUrl = referral.source_url
    // Urls can go up to 2048 characters, but we limit to 500 to avoid tags limit error
    const processedUrl = originalUrl.slice(0, 500)

    if (originalUrl !== processedUrl) {
      logger
        .forBot()
        .warn(
          `For whatsapp message "${message.id}", referral source URL was truncated from ${originalUrl.length} to 500 characters. Original: ${originalUrl}, Sliced: ${processedUrl}`
        )
    }

    tags.referralSourceUrl = processedUrl
  }

  if (referral.source_id) {
    tags.referralSourceId = referral.source_id
  }

  return tags
}
