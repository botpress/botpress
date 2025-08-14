import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import axios from 'axios'
import * as crypto from 'crypto'
import queryString from 'query-string'
import { Twilio } from 'twilio'
import * as types from './types'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async (props) => void (await sendMessage({ ...props, text: props.payload.text })),
        image: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.imageUrl })),
        markdown: async (props) => void (await sendMessage({ ...props, text: props.payload.markdown })),
        audio: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.audioUrl })),
        video: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.videoUrl })),
        file: async (props) => void (await sendMessage({ ...props, text: props.payload.fileUrl })),
        location: async (props) =>
          void (await sendMessage({
            ...props,
            text: `https://www.google.com/maps/search/?api=1&query=${props.payload.latitude},${props.payload.longitude}`,
          })),
        carousel: async (props) => {
          const {
            payload: { items },
          } = props
          const total = items.length
          for (const [i, card] of items.entries()) {
            await sendMessage({ ...props, text: renderCard(card, `${i + 1}/${total}`), mediaUrl: card.imageUrl })
          }
        },
        card: async (props) => {
          const { payload: card } = props
          await sendMessage({ ...props, text: renderCard(card), mediaUrl: card.imageUrl })
        },
        dropdown: async (props) => {
          await sendMessage({ ...props, text: renderChoiceMessage(props.payload) })
        },
        choice: async (props) => {
          await sendMessage({ ...props, text: renderChoiceMessage(props.payload) })
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    console.info('Handler received request')

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

        if (mediaUrl && typeof mediaUrl === 'string') {
          try {
            // Get media metadata first
            const metadata = await getTwilioMediaMetadata(mediaUrl, ctx)

            // Download media if configuration is enabled, otherwise use original URL
            let finalMediaUrl = mediaUrl
            if ((ctx.configuration as any).downloadMedia) {
              finalMediaUrl = await _downloadTwilioMedia(mediaUrl, client, ctx)
            }

            // Determine message type based on MIME type and create payload
            const { messageType, payload } = getMessageTypeAndPayload(
              finalMediaUrl,
              metadata.mimeType,
              metadata.fileName
            )

            await client.createMessage({
              tags: { id: `${messageSid}_media_${i}` },
              type: messageType as any, // Type assertion needed for dynamic message types
              userId: user.id,
              conversationId: conversation.id,
              payload,
            })
          } catch (error) {
            logger.forBot().error(`Failed to create message for media ${i + 1}:`, error)
          }
        } else {
          logger.forBot().error(`Missing or invalid media URL for media ${i + 1}`)
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

    console.info('Handler received request', data)
  },

  createUser: async ({ client, tags, ctx }) => {
    const userPhone = tags.userPhone
    if (!userPhone) {
      return
    }

    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

    const { user } = await client.getOrCreateUser({
      tags: { userPhone: `${phone.phoneNumber}` },
    })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },

  createConversation: async ({ client, channel, tags, ctx }) => {
    const userPhone = tags.userPhone
    const activePhone = tags.activePhone
    if (!(userPhone && activePhone)) {
      return
    }

    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { userPhone: `${phone.phoneNumber}`, activePhone },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

type Choice = bp.channels.channel.choice.Choice

function renderChoiceMessage(payload: Choice) {
  return `${payload.text || ''}\n\n${payload.options
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

type Card = bp.channels.channel.card.Card

function renderCard(card: Card, total?: string): string {
  return `${total ? `${total}: ` : ''}${card.title}\n\n${card.subtitle || ''}\n\n${card.actions
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

function getPhoneNumbers(conversation: types.Conversation) {
  const to = conversation.tags?.userPhone
  const from = conversation.tags?.activePhone

  if (!to) {
    throw new Error('Invalid to phone number')
  }

  if (!from) {
    throw new Error('Invalid from phone number')
  }

  return { to, from }
}

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack'> & {
  mediaUrl?: string
  text?: string
}

/**
 * Gets Twilio media metadata (MIME type, file size, filename)
 */
async function getTwilioMediaMetadata(
  mediaUrl: string,
  ctx: bp.Context
): Promise<{ mimeType: string; fileSize: number; fileName?: string }> {
  try {
    const headResponse = await axios.head(mediaUrl, {
      auth: {
        username: ctx.configuration.accountSID,
        password: ctx.configuration.authToken,
      },
    })

    const mimeType = headResponse.headers['content-type'] || 'application/octet-stream'
    const fileSize = parseInt(headResponse.headers['content-length'] || '0', 10)

    // Try to extract filename from content-disposition header
    let fileName: string | undefined
    const contentDisposition = headResponse.headers['content-disposition']
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i)
      const rawFileName = match?.[1]
      if (rawFileName) {
        fileName = decodeURIComponent(rawFileName)
      }
    }

    return {
      mimeType,
      fileSize,
      fileName,
    }
  } catch (error) {
    throw new RuntimeError(
      `Failed to get Twilio media metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Downloads Twilio media and stores it in the Botpress file API
 */
async function _downloadTwilioMedia(mediaUrl: string, client: bp.Client, ctx: bp.Context): Promise<string> {
  try {
    // Get file metadata
    const { mimeType, fileSize } = await getTwilioMediaMetadata(mediaUrl, ctx)

    // Generate a unique ID from the URL
    const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(mediaUrl))
    const uniqueId = Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 24)

    // Create file in Botpress file API
    const { file } = await client.upsertFile({
      key: `twilio-media_${uniqueId}`,
      expiresAt: _getMediaExpiry(ctx),
      contentType: mimeType,
      accessPolicies: ['public_content'],
      publicContentImmediatelyAccessible: true,
      size: fileSize,
      tags: {
        source: 'integration',
        integration: 'twilio',
        channel: 'channel',
        originUrl: mediaUrl,
      },
    })

    // Download the media from Twilio
    const downloadResponse = await axios.get(mediaUrl, {
      responseType: 'stream',
      auth: {
        username: ctx.configuration.accountSID,
        password: ctx.configuration.authToken,
      },
    })

    // Upload to Botpress file API
    await axios.put(file.uploadUrl, downloadResponse.data, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'x-amz-tagging': 'public=true',
      },
      maxBodyLength: fileSize,
    })

    return file.url
  } catch (error) {
    throw new RuntimeError(
      `Failed to download Twilio media: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Gets media expiry time based on configuration
 */
function _getMediaExpiry(ctx: bp.Context): string | undefined {
  const expiryDelayHours = (ctx.configuration as any).downloadedMediaExpiry || 0
  if (expiryDelayHours === 0) {
    return undefined
  }
  const expiresAt = new Date(Date.now() + expiryDelayHours * 60 * 60 * 1000)
  return expiresAt.toISOString()
}

/**
 * Determines the appropriate message type and payload based on MIME type
 */
function getMessageTypeAndPayload(
  mediaUrl: string,
  contentType: string | null | undefined,
  fileName?: string
): { messageType: string; payload: any } {
  const mimeType = contentType?.toLowerCase() || ''

  if (mimeType.startsWith('image/')) {
    return {
      messageType: 'image',
      payload: { imageUrl: mediaUrl },
    }
  }

  if (mimeType.startsWith('audio/')) {
    return {
      messageType: 'audio',
      payload: { audioUrl: mediaUrl },
    }
  }

  if (mimeType.startsWith('video/')) {
    return {
      messageType: 'video',
      payload: { videoUrl: mediaUrl },
    }
  }

  // Default to file for other types (documents, etc.)
  return {
    messageType: 'file',
    payload: {
      fileUrl: mediaUrl,
      title: fileName || contentType || 'file',
    },
  }
}

async function sendMessage({ ctx, conversation, ack, mediaUrl, text }: SendMessageProps) {
  const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
  const { to, from } = getPhoneNumbers(conversation)
  const { sid } = await twilioClient.messages.create({ to, from, mediaUrl, body: text })
  await ack({ tags: { id: sid } })
}
