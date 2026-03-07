import { Telnyx } from 'telnyx'
import * as bp from '.botpress'

interface TelnyxWebhookPayload {
  data: {
    event_type: string
    payload: {
      from: { phone_number: string }
      to: { phone_number: string }
      body?: { text: string }
      id: string
    }
  }
}

function parseTelnyxWebhook(body: string): TelnyxWebhookPayload | null {
  try {
    return JSON.parse(body) as TelnyxWebhookPayload
  } catch {
    return null
  }
}

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  // Check if this is a JSON webhook (voice events, status callbacks)
  const jsonPayload = parseTelnyxWebhook(req.body)
  if (jsonPayload && jsonPayload.data) {
    const event = jsonPayload.data
    const eventType = event.event_type

    // Handle call events
    if (eventType.startsWith('call')) {
      const callPayload = event.payload
      const userPhone = callPayload.from.phone_number
      const telnyxNumber = callPayload.to.phone_number
      const callId = callPayload.id

      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          userPhone,
          telnyxNumber,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          userPhone,
        },
      })

      // Handle different call events
      if (eventType === 'call.initiated') {
        await client.createMessage({
          tags: { id: `${callId}_initiated` },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: 'Outbound call initiated' },
        })
      } else if (eventType === 'call.answered') {
        await client.createMessage({
          tags: { id: `${callId}_answered` },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: 'Call answered' },
        })
      } else if (eventType === 'call.hangup') {
        await client.createMessage({
          tags: { id: `${callId}_hangup` },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: 'Call ended' },
        })
      } else if (eventType === 'call.failed') {
        await client.createMessage({
          tags: { id: `${callId}_failed` },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: 'Call failed' },
        })
      }

      return
    }
  }

  // Handle URL-encoded form data (SMS messages)
  const params = new URLSearchParams(req.body)
  const userPhone = params.get('from')
  const telnyxNumber = params.get('to')
  const messageText = params.get('body')
  const messageId = params.get('message_id')

  if (!userPhone || !telnyxNumber) {
    console.warn('Handler received invalid phone numbers')
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      userPhone,
      telnyxNumber,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      userPhone,
    },
  })

  if (messageText) {
    await client.createMessage({
      tags: { id: messageId || `${Date.now()}` },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: messageText },
    })
  }
}