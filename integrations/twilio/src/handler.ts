import queryString from 'query-string'
import { downloadTwilioMedia, getMessageTypeAndPayload, getTwilioMediaMetadata } from './utils'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const data = queryString.parse(req.body)

  // Twilio webhook data structure for media messages:
  // - NumMedia: Number of media files (e.g., "1", "2")
  // - MediaUrl0, MediaUrl1, etc.: URLs to the media files
  // - MediaContentType0, MediaContentType1, etc.: MIME types of the media files
  // - Body: Text message (may be empty if only media is sent)
  // - From: Sender's phone number
  // - To: Recipient's phone number (your Twilio number)
  // - MessageSid: Unique identifier for the message

  const userPhone = data.From

  if (typeof userPhone !== 'string') {
    throw new Error('Handler received an invalid user phone number')
  }

  const activePhone = data.To

  if (typeof activePhone !== 'string') {
    throw new Error('Handler received an invalid active phone number')
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      userPhone,
      activePhone,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      userPhone,
    },
  })

  const messageSid = data.MessageSid

  if (typeof messageSid !== 'string') {
    throw new Error('Handler received an invalid message sid')
  }

  const text = data.Body
  const numMedia = parseInt((data.NumMedia as string) || '0', 10)

  // If there's media, create appropriate message types for each media
  if (numMedia > 0) {
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = data[`MediaUrl${i}` as keyof typeof data]

      // Guard condition: skip invalid media URLs
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        logger.forBot().error(`Missing or invalid media URL for media ${i + 1}`)
        continue
      }

      try {
        // Get media metadata first
        const metadata = await getTwilioMediaMetadata(mediaUrl, ctx)

        // Download media if configuration is enabled, otherwise use original URL
        let finalMediaUrl = mediaUrl
        if (ctx.configuration.downloadMedia) {
          finalMediaUrl = await downloadTwilioMedia(mediaUrl, client, ctx)
        }

        // Determine message type based on MIME type and create payload
        const { messageType, payload } = getMessageTypeAndPayload(finalMediaUrl, metadata.mimeType, metadata.fileName)

        await client.createMessage({
          tags: { id: `${messageSid}_media_${i}` },
          type: messageType,
          userId: user.id,
          conversationId: conversation.id,
          payload,
        })
      } catch (error) {
        logger.forBot().error(`Failed to create message for media ${i + 1}:`, error)
      }
    }
  }

  // Create text message if text is present (regardless of whether media was also sent)
  if (typeof text === 'string' && text.trim()) {
    await client.createMessage({
      tags: { id: messageSid },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text },
    })
  }
}
