import * as crypto from 'crypto'
import { executeConversationStarted } from '../events/messaging/conversation-started'
import type { SunshineConversationsWebhook } from '../types/messaging-events'
import * as bp from '.botpress'

function verifyWebhookSignature(body: string, signature: string | undefined, secret: string | undefined): boolean {
  if (!signature || !secret) {
    return false
  }

  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const expectedSignature = hmac.digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch {
    return false
  }
}

export const handleMessagingWebhook = async (props: bp.HandlerProps): Promise<boolean> => {
  const { req, ctx, client, logger } = props

  // Check if this is a messaging webhook by looking for the events array structure
  try {
    const body = req.body || '{}'
    const parsedBody: unknown = JSON.parse(body)

    if (
      !parsedBody ||
      typeof parsedBody !== 'object' ||
      !('events' in parsedBody) ||
      !Array.isArray(parsedBody.events) ||
      !ctx.configuration.messagingAppId
    ) {
      return false
    }

    // Verify webhook signature if secret is configured
    if (ctx.configuration.messagingWebhookSecret) {
      const signature = req.headers['x-smooch-signature'] || req.headers['x-sunco-signature']
      const signatureString = Array.isArray(signature) ? signature[0] : signature

      if (!verifyWebhookSignature(body, signatureString, ctx.configuration.messagingWebhookSecret)) {
        logger.forBot().warn('Invalid webhook signature for messaging webhook')
        return false
      }
    }

    const webhook = parsedBody as SunshineConversationsWebhook

    for (const event of webhook.events) {
      if (event.type === 'conversation:create') {
        await executeConversationStarted({ event, client, logger })
        continue
      }

      if (event.type !== 'conversation:message') {
        continue
      }

      const payload = event.payload

      if (payload?.message?.content?.type !== 'text') {
        continue
      }

      if (payload.message.author?.type === 'business') {
        continue
      }

      if (!payload.conversation?.id || !payload.message?.author?.userId || !payload.message?.id) {
        logger.forBot().warn('Message event missing required fields')
        continue
      }

      const { conversation: botpressConversation } = await client.getOrCreateConversation({
        channel: 'messaging',
        tags: {
          id: payload.conversation.id,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: payload.message.author.userId,
        },
        name: payload.message.author.displayName,
        pictureUrl: payload.message.author.avatarUrl,
      })

      await client.createMessage({
        tags: { id: payload.message.id },
        type: 'text',
        userId: user.id,
        conversationId: botpressConversation.id,
        payload: { text: payload.message.content.text || '' },
      })
    }

    return true
  } catch (error) {
    // If parsing fails or structure doesn't match, this is not a messaging webhook
    logger.forBot().debug('Failed to parse as messaging webhook', { error })
    return false
  }
}
