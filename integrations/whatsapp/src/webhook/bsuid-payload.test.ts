import { describe, expect, it } from 'vitest'
import { WhatsAppPayloadSchema } from '../misc/types'

const usernameOnlyMessagePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'waba-id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551230000',
              phone_number_id: 'business-phone-id',
            },
            contacts: [
              {
                profile: { name: 'Julian', username: 'Julianzlc' },
                user_id: 'CO.1047385771169864',
              },
            ],
            messages: [
              {
                from_user_id: 'CO.1047385771169864',
                id: 'wamid.username-only-incoming',
                timestamp: '1784232425',
                type: 'text',
                text: { body: 'Hello' },
              },
            ],
          },
        },
      ],
    },
  ],
}

const statusPayload = (status: 'delivered' | 'failed') => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'waba-id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551230000',
              phone_number_id: 'business-phone-id',
            },
            statuses: [
              {
                id: `wamid.username-only-${status}`,
                status,
                timestamp: '1784232500',
                recipient_user_id: 'CO.1047385771169864',
                recipient_parent_user_id: 'CA.2086157822334836',
                ...(status === 'failed'
                  ? {
                      errors: [
                        {
                          code: 131026,
                          title: 'Message undeliverable',
                          message: 'Message undeliverable',
                          error_data: { details: 'The recipient could not receive this message' },
                        },
                      ],
                    }
                  : {}),
              },
            ],
          },
        },
      ],
    },
  ],
})

describe('BSUID webhook payloads', () => {
  it('accepts an inbound message without wa_id or from', () => {
    const result = WhatsAppPayloadSchema.safeParse(usernameOnlyMessagePayload)

    expect(result.success).toBe(true)
    if (result.success) {
      const change = result.data.entry[0]!.changes[0]!
      expect(change.field).toBe('messages')
      if (change.field === 'messages') {
        expect(change.value.contacts?.[0]?.user_id).toBe('CO.1047385771169864')
        expect(change.value.messages?.[0]?.from_user_id).toBe('CO.1047385771169864')
      }
    }
  })

  it.each(['delivered', 'failed'] as const)(
    'accepts a %s status with recipient_user_id and no recipient_id',
    (status) => {
      const result = WhatsAppPayloadSchema.safeParse(statusPayload(status))

      expect(result.success).toBe(true)
      if (result.success) {
        const change = result.data.entry[0]!.changes[0]!
        expect(change.field).toBe('messages')
        if (change.field === 'messages') {
          expect(change.value.statuses?.[0]).toMatchObject({
            recipient_user_id: 'CO.1047385771169864',
            recipient_parent_user_id: 'CA.2086157822334836',
          })
          expect(change.value.statuses?.[0]?.recipient_id).toBeUndefined()
        }
      }
    }
  )
})
