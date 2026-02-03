import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import * as crypto from 'crypto'
import { TwilioChannel } from './twilio'
import { Card, Choice, Conversation, CreateMessageInputPayload, CreateMessageInputType } from './types'
import * as bp from '.botpress'

/**
 * Gets phone numbers from conversation tags
 */
export function getPhoneNumbers(conversation: Conversation) {
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

/**
 * Determines the Twilio channel type based on user phone format
 */
export function getTwilioChannelType(user: string): TwilioChannel {
  if (user.startsWith('whatsapp')) {
    return 'whatsapp'
  }
  if (user.startsWith('messenger')) {
    return 'messenger'
  }
  if (user.startsWith('rcs')) {
    return 'rcs'
  }
  return 'sms/mms'
}

/**
 * Gets Twilio media metadata (MIME type, file size, filename)
 */
export async function getTwilioMediaMetadata(
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
export async function downloadTwilioMedia(mediaUrl: string, client: bp.Client, ctx: bp.Context): Promise<string> {
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
      expiresAt: getMediaExpiry(ctx),
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
export function getMediaExpiry(ctx: bp.Context): string | undefined {
  const expiryDelayHours = ctx.configuration?.downloadedMediaExpiry || 0
  if (expiryDelayHours === 0) {
    return undefined
  }
  const expiresAt = new Date(Date.now() + expiryDelayHours * 60 * 60 * 1000)
  return expiresAt.toISOString()
}

/**
 * Determines the appropriate message type and payload based on MIME type
 */
export function getMessageTypeAndPayload(
  mediaUrl: string,
  contentType: string | null | undefined,
  fileName?: string
): { messageType: CreateMessageInputType; payload: CreateMessageInputPayload } {
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

/**
 * Renders choice/dropdown message as text for SMS
 */
export function renderChoiceMessage(payload: Choice): string {
  return `${payload.text || ''}\n\n${payload.options
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

/**
 * Renders card as text for SMS
 */
export function renderCard(card: Card, total?: string): string {
  return `${total ? `${total}: ` : ''}${card.title}\n\n${card.subtitle || ''}\n\n${card.actions
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}
