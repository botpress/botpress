import { channel } from 'integration.definition'
import WhatsAppAPI from 'whatsapp-api-js'
import { getAccessToken } from '../../auth'
import { WhatsAppPayload, WhatsAppMessage, WhatsAppValue } from '../../misc/types'
import { getMediaUrl } from '../../misc/whatsapp-utils'
import * as bp from '.botpress'

export const messagesHandler = async (props: bp.HandlerProps) => {
  const { req, ctx, client, logger } = props
  if (!req.body) {
    logger.debug('Handler received an empty body, so the message was ignored')
    return
  }

  try {
    const data = JSON.parse(req.body) as WhatsAppPayload
    for (const { changes } of data.entry) {
      for (const change of changes) {
        if (!change.value.messages) {
          // If the change doesn't contain messages we can ignore it, as we don't currently process other change types (such as statuses).
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
  if (message.type) {
    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: {
        userPhone: message.from,
        phoneNumberId: value.metadata.phone_number_id,
      },
    })

    if (value.contacts.length > 0) {
      const { user } = await client.getOrCreateUser({
        tags: {
          userId: value.contacts[0] ? value.contacts[0].wa_id : '',
          name: value.contacts[0] ? value.contacts[0]?.profile.name : '',
        },
        name: value.contacts[0] ? value.contacts[0]?.profile.name : '',
      })

      if (message.text) {
        logger.forBot().debug('Received text message from Whatsapp:', message.text.body)

        await client.createMessage({
          tags: { id: message.id },
          type: 'text',
          payload: { text: message.text.body },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.button) {
        logger.forBot().debug('Received button message from Whatsapp:', message.button)

        await client.createMessage({
          tags: { id: message.id },
          type: 'text',
          payload: {
            text: message.button.text,
          },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.location) {
        logger.forBot().debug('Received location message from Whatsapp:', JSON.stringify(message.location))

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
      } else if (message.image) {
        logger.forBot().debug('Received image message from Whatsapp:', message.button)

        const imageUrl = await getMediaUrl(message.image.id, client, ctx)

        await client.createMessage({
          tags: { id: message.id },
          type: 'image',
          payload: { imageUrl },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.audio) {
        logger.forBot().debug('Received audio message from Whatsapp:', message.button)

        const audioUrl = await getMediaUrl(message.audio.id, client, ctx)

        await client.createMessage({
          tags: { id: message.id },
          type: 'audio',
          payload: { audioUrl },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.document) {
        logger.forBot().debug('Received document message from Whatsapp:', message.button)

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
      } else if (message.video) {
        logger.forBot().debug('Received video message from Whatsapp:', message.video)

        const videoUrl = await getMediaUrl(message.video.id, client, ctx)

        await client.createMessage({
          tags: { id: message.id },
          type: 'video',
          payload: { videoUrl },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.interactive) {
        if (message.interactive.type === 'button_reply') {
          logger.forBot().debug('Received button reply from Whatsapp:', message.interactive.button_reply)

          await client.createMessage({
            tags: { id: message.id },
            type: 'text',
            payload: {
              text: message.interactive.button_reply?.id!,
              // TODO: declare in definition
              // metadata: message.interactive.button_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else if (message.interactive.type === 'list_reply') {
          logger.forBot().debug('Received list reply from Whatsapp:', message.interactive.list_reply)

          await client.createMessage({
            tags: { id: message.id },
            type: 'text',
            payload: {
              text: message.interactive.list_reply?.id!,
              // TODO: declare in definition
              // metadata: message.interactive.list_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else {
          logger.forBot().warn(`Unhandled interactive type: ${JSON.stringify(message.interactive.type)}`)
        }
      } else {
        logger.forBot().warn(`Unhandled message type: ${JSON.stringify(message)}`)
      }
    } else {
      logger.forBot().warn('Ignored message from Whatsapp because it did not have any contacts')
    }
  }
}
