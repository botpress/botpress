import WhatsAppAPI from 'whatsapp-api-js'
import { getAccessToken } from '../../auth'
import { WhatsAppMessage, WhatsAppValue, WhatsAppPayloadSchema } from '../../misc/types'
import { getMediaUrl } from '../../misc/whatsapp-utils'
import * as bp from '.botpress'

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
          const accessToken = await getAccessToken(client, ctx)
          const whatsapp = new WhatsAppAPI({ token: accessToken, secure: false })
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
    channel: 'whatsapp',
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

  if (message.type === 'text') {
    logger.forBot().debug('Received text message from WhatsApp:', message.text.body)

    await client.createMessage({
      tags: { id: message.id },
      type: 'text',
      payload: { text: message.text.body },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'button') {
    logger.forBot().debug('Received button message from WhatsApp:', message.button)

    await client.createMessage({
      tags: { id: message.id },
      type: 'text',
      payload: {
        text: message.button.text,
      },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'location') {
    logger.forBot().debug('Received location message from WhatsApp:', JSON.stringify(message.location))

    await client.createMessage({
      tags: { id: message.id },
      type: 'location',
      payload: {
        latitude: Number(message.location.latitude),
        longitude: Number(message.location.longitude),
        address: message.location.address,
        title: message.location.name,
      },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'image') {
    logger.forBot().debug('Received image message from WhatsApp:', message.image)

    const imageUrl = await getMediaUrl(message.image.id, client, ctx)

    await client.createMessage({
      tags: { id: message.id },
      type: 'image',
      payload: { imageUrl },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'audio') {
    logger.forBot().debug('Received audio message from WhatsApp:', message.audio)

    const audioUrl = await getMediaUrl(message.audio.id, client, ctx)

    await client.createMessage({
      tags: { id: message.id },
      type: 'audio',
      payload: { audioUrl },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'document') {
    logger.forBot().debug('Received document message from WhatsApp:', message.document)

    const documentUrl = await getMediaUrl(message.document.id, client, ctx)

    await client.createMessage({
      tags: { id: message.id },
      type: 'file',
      payload: {
        fileUrl: documentUrl,
        filename: message.document.filename,
      },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'video') {
    logger.forBot().debug('Received video message from WhatsApp:', message.video)

    const videoUrl = await getMediaUrl(message.video.id, client, ctx)

    await client.createMessage({
      tags: { id: message.id },
      type: 'video',
      payload: { videoUrl },
      userId: user.id,
      conversationId: conversation.id,
    })
  } else if (message.type === 'interactive') {
    if (message.interactive.type === 'button_reply') {
      logger.forBot().debug('Received button reply from WhatsApp:', message.interactive.button_reply)

      await client.createMessage({
        tags: { id: message.id },
        type: 'text',
        payload: {
          text: message.interactive.button_reply.id,
          // TODO: declare in definition
          // metadata: message.interactive.button_reply?.title,
        },
        userId: user.id,
        conversationId: conversation.id,
      })
    } else if (message.interactive.type === 'list_reply') {
      logger.forBot().debug('Received list reply from WhatsApp:', message.interactive.list_reply)

      await client.createMessage({
        tags: { id: message.id },
        type: 'text',
        payload: {
          text: message.interactive.list_reply.id,
          // TODO: declare in definition
          // metadata: message.interactive.list_reply?.title,
        },
        userId: user.id,
        conversationId: conversation.id,
      })
    }
  } else {
    logger.forBot().warn(`Unhandled message type ${message.type}: ${JSON.stringify(message)}`)
  }
}
