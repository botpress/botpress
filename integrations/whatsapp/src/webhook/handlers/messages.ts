import { ValueOf } from '@botpress/sdk/dist/utils/type-utils'
import { getAuthenticatedWhatsappClient } from 'src/auth'
import { WhatsAppMessage, WhatsAppValue, WhatsAppPayloadSchema } from '../../misc/types'
import { getMediaUrl } from '../../misc/whatsapp-utils'
import * as bp from '.botpress'

type IncomingMessages = {
  [TMessage in keyof bp.channels.channel.Messages]: {
    type: TMessage
    payload: bp.channels.channel.Messages[TMessage]
  }
}

export const messagesHandler = async (props: bp.HandlerProps) => {
  const { req, ctx, client, logger } = props
  if (!req.body) {
    logger.debug('Handler received an empty body, so the message was ignored')
    return
  }

  try {
    const data = JSON.parse(req.body)
    const payload = WhatsAppPayloadSchema.parse(data)

    for (const { changes } of payload.entry) {
      for (const change of changes) {
        if (!change.value.messages) {
          // If the change doesn't contain messages we can ignore it, as we don't currently process other change types (such as statuses or errors).
          continue
        }

        for (const message of change.value.messages) {
          const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
          const phoneNumberId = change.value.metadata.phone_number_id
          await whatsapp.markAsRead(phoneNumberId, message.id)
          await _handleIncomingMessage(message, change.value, ctx, client, logger)
        }
      }
    }
  } catch (e: any) {
    logger.debug('Error while handling request:', e)
    return { status: 500, body: 'Error while handling request: ' + e.message }
  }

  return { status: 200 }
}

async function _handleIncomingMessage(
  message: WhatsAppMessage,
  value: WhatsAppValue,
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger
) {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      userPhone: message.from,
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
  }: ValueOf<IncomingMessages> & { incomingMessageType?: string }) => {
    logger.forBot().debug(`Received ${incomingMessageType ?? type} message from WhatsApp:`, payload)
    return client.createMessage({
      tags: { id: message.id },
      type,
      payload,
      userId: user.id,
      conversationId: conversation.id,
    })
  }
  const { type } = message
  if (type === 'text') {
    await createMessage({ type, payload: { text: message.text.body } })
  } else if (type === 'button') {
    await createMessage({
      type: 'text',
      payload: {
        text: message.button.payload,
        label: message.button.text,
      },
    })
  } else if (type === 'location') {
    const { latitude, longitude, address, name } = message.location
    await createMessage({
      type,
      payload: { latitude: Number(latitude), longitude: Number(longitude), title: name, address },
    })
  } else if (type === 'image') {
    const imageUrl = await getMediaUrl(message.image.id, client, ctx)
    await createMessage({ type, payload: { imageUrl } })
  } else if (type === 'audio') {
    const audioUrl = await getMediaUrl(message.audio.id, client, ctx)
    await createMessage({ type, payload: { audioUrl } })
  } else if (type === 'document') {
    const documentUrl = await getMediaUrl(message.document.id, client, ctx)
    await createMessage({ type: 'file', payload: { fileUrl: documentUrl, filename: message.document.filename } })
  } else if (type === 'video') {
    const videoUrl = await getMediaUrl(message.video.id, client, ctx)
    await createMessage({ type, payload: { videoUrl } })
  } else if (message.type === 'interactive') {
    if (message.interactive.type === 'button_reply') {
      const { id: text, title: label } = message.interactive.button_reply
      await createMessage({
        type: 'text',
        payload: { text, label },
        incomingMessageType: type,
      })
    } else if (message.interactive.type === 'list_reply') {
      const { id: text, title: label } = message.interactive.list_reply
      await createMessage({
        type: 'text',
        payload: { text, label },
        incomingMessageType: type,
      })
    }
  } else {
    logger.forBot().warn(`Unhandled message type ${type}: ${JSON.stringify(message)}`)
  }
}
