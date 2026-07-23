import { describe, expect, test } from 'vitest'
import { WhatsAppPayloadSchema } from '../misc/types'

/**
 * Reproduction for SHK-1558: Meta can omit `contacts[].profile` in messages webhooks.
 *
 * The webhook handler validates the whole request with `WhatsAppPayloadSchema.parse(data)` before
 * dispatching. Requiring the contact profile rejected these payloads and returned HTTP 500.
 */

const realisticMessagePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '102290129340398',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550001111',
              phone_number_id: '106540352242922',
            },
            contacts: [
              {
                wa_id: '14169385443',
                user_id: 'user:14169385443',
              },
            ],
            messages: [
              {
                from: '14169385443',
                id: 'wamid.HBgLMTQxNjkzODU0NDMVAgARGBI5QTND',
                timestamp: '1719421200',
                type: 'text',
                text: {
                  body: 'Hello from a contact without a profile.',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
}

describe('messages payload contact profile validation (SHK-1558)', () => {
  test('a realistic message from Meta parses when contact.profile is omitted', () => {
    const result = WhatsAppPayloadSchema.safeParse(realisticMessagePayload)

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    const change = result.data.entry[0]?.changes[0]
    expect(change?.field).toBe('messages')
    if (change?.field !== 'messages') {
      return
    }

    const contact = change.value.contacts?.[0]
    expect(contact?.profile).toBeUndefined()
  })

  test('a message that includes contact.profile.name still parses', () => {
    const withProfile = structuredClone(realisticMessagePayload)
    ;(withProfile.entry[0]!.changes[0]!.value.contacts![0]! as any).profile = {
      name: 'Jane Customer',
    }

    const result = WhatsAppPayloadSchema.safeParse(withProfile)

    expect(result.success).toBe(true)
  })
})
