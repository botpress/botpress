import { RuntimeError, isApiError } from '@botpress/client'
import { posthogHelper } from '@botpress/common'
import { ValueOf } from '@botpress/sdk/dist/utils/type-utils'
import axios from 'axios'
import { INTEGRATION_NAME } from 'integration.definition'
import { getAccessToken, getAuthenticatedWhatsappClient } from '../../auth'
import { formatPhoneNumber } from '../../misc/phone-number-to-whatsapp'
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

export const messagesHandler = async (
  message: NonNullable<WhatsAppMessageValue['messages']>[number],
  value: WhatsAppMessageValue,
  props: bp.HandlerProps
) => {
  const { ctx, client, logger } = props

  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const phoneNumberId = value.metadata.phone_number_id
  await whatsapp.markAsRead(phoneNumberId, message.id)
  await _handleIncomingMessage(message, value, ctx, client, logger)

  return { status: 200 }
}

async function _handleIncomingMessage(
  message: WhatsAppMessage,
  value: WhatsAppMessageValue,
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger
) {
  let userPhone = message.from
  try {
    userPhone = formatPhoneNumber(message.from)
  } catch (thrown) {
    const distinctId = isApiError(thrown) ? thrown.id : undefined
    await posthogHelper.sendPosthogEvent(
      {
        distinctId: distinctId ?? 'no id',
        event: 'invalid_phone_number',
        properties: {
          from: 'handler',
          phoneNumber: message.from,
        },
      },
      { integrationName: INTEGRATION_NAME, key: bp.secrets.POSTHOG_KEY }
    )
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    logger.error(`Failed to parse phone number "${message.from}": ${errorMessage}`)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      userPhone,
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
      name: contact?.profile.name,
    },
    name: contact?.profile.name,
  })

  const createMessage = async ({
    type,
    payload,
    incomingMessageType,
    replyTo,
  }: ValueOf<IncomingMessages> & { incomingMessageType?: string; replyTo?: string }) => {
    logger.forBot().debug(`Received ${incomingMessageType ?? type} message from WhatsApp:`, payload)
    return client.getOrCreateMessage({
      tags: { id: message.id, replyTo },
      type,
      payload,
      userId: user.id,
      conversationId: conversation.id,
      discriminateByTags: ['id'],
    })
  }

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

  const { type } = message
  if (type === 'text') {
    await createMessage({ type, payload: { text: message.text.body }, replyTo })
  } else if (type === 'button') {
    await createMessage({
      type: 'text',
      payload: {
        value: message.button.payload,
        text: message.button.text,
      },
      replyTo,
    })
  } else if (type === 'location') {
    const { latitude, longitude, address, name } = message.location
    await createMessage({
      type,
      payload: { latitude: Number(latitude), longitude: Number(longitude), title: name, address },
      replyTo,
    })
  } else if (type === 'image') {
    const imageUrl = await _getOrDownloadWhatsappMedia(message.image.id, client, ctx)
    await createMessage({ type, payload: { imageUrl }, replyTo })
  } else if (type === 'sticker') {
    const stickerUrl = await _getOrDownloadWhatsappMedia(message.sticker.id, client, ctx)
    await createMessage({ type: 'image', payload: { imageUrl: stickerUrl }, replyTo })
  } else if (type === 'audio') {
    const audioUrl = await _getOrDownloadWhatsappMedia(message.audio.id, client, ctx)
    await createMessage({ type, payload: { audioUrl }, replyTo })
  } else if (type === 'document') {
    const documentUrl = await _getOrDownloadWhatsappMedia(message.document.id, client, ctx)
    await createMessage({
      type: 'file',
      payload: { fileUrl: documentUrl, filename: message.document.filename },
      replyTo,
    })
  } else if (type === 'video') {
    const videoUrl = await _getOrDownloadWhatsappMedia(message.video.id, client, ctx)
    await createMessage({ type, payload: { videoUrl }, replyTo })
  } else if (message.type === 'interactive') {
    if (message.interactive.type === 'button_reply') {
      const { id: value, title: text } = message.interactive.button_reply
      await createMessage({
        type: 'text',
        payload: { value, text },
        incomingMessageType: type,
        replyTo,
      })
    } else if (message.interactive.type === 'list_reply') {
      const { id: value, title: text } = message.interactive.list_reply
      await createMessage({
        type: 'text',
        payload: { value, text },
        incomingMessageType: type,
        replyTo,
      })
    }
  } else if (message.type === 'unsupported' || message.type === 'unknown') {
    const errors = message.errors?.map((err) => `${err.message} (${err.error_data.details})`).join('\n')
    logger.forBot().warn(`Received message type ${message.type} by WhatsApp, errors: ${errors ?? 'none'}`)
  } else {
    logger.forBot().warn(`Unhandled message type ${type}: ${JSON.stringify(message)}`)
  }
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
