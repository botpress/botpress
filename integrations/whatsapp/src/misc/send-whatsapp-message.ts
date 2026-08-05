import type { WhatsAppAPI } from 'whatsapp-api-js'
import type { ClientMessage, ServerMessageResponse } from 'whatsapp-api-js/types'
import { WHATSAPP } from './constants'

export type WhatsAppDestination = { type: 'phone'; phoneNumber: string } | { type: 'bsuid'; userId: string }

export type WhatsAppConversationRecipientTags = {
  userPhone?: string
  userId?: string
}

export type WhatsAppSendResponse =
  | {
      messaging_product: 'whatsapp'
      contacts?: { input: string; wa_id?: string }[]
      messages: [{ id: string; message_status?: 'accepted' | 'held_for_quality_assessment' }]
    }
  | {
      error: {
        message: string
        code: number
        type?: string
        error_data?: { messaging_product?: string; details?: string }
        error_subcode?: number
        fbtrace_id?: string
      }
    }

export const resolveWhatsAppDestination = (
  tags: WhatsAppConversationRecipientTags
): WhatsAppDestination | undefined => {
  if (tags.userPhone) {
    return { type: 'phone', phoneNumber: tags.userPhone }
  }
  if (tags.userId) {
    return { type: 'bsuid', userId: tags.userId }
  }
  return undefined
}

export const buildBsuidMessageRequest = (
  destination: Extract<WhatsAppDestination, { type: 'bsuid' }>,
  message: ClientMessage
) => {
  return {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    recipient: destination.userId,
    type: message._type,
    [message._type]: message,
  }
}

export const sendWhatsAppMessage = async (
  whatsapp: WhatsAppAPI,
  botPhoneNumberId: string,
  destination: WhatsAppDestination,
  message: ClientMessage
): Promise<WhatsAppSendResponse> => {
  if (destination.type === 'phone') {
    const response = await whatsapp.sendMessage(botPhoneNumberId, destination.phoneNumber, message)
    return await _parseResponse(response)
  }

  // using $$apiFetch$$ since the library does not expose BSUID message yet
  const response = await whatsapp.$$apiFetch$$(`${WHATSAPP.API_URL}/${botPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildBsuidMessageRequest(destination, message)),
  })
  return await _parseResponse(response)
}

const _parseResponse = async (response: ServerMessageResponse | Response): Promise<WhatsAppSendResponse> => {
  if (response instanceof Response) {
    return (await response.json()) as WhatsAppSendResponse
  }
  return response as WhatsAppSendResponse
}
