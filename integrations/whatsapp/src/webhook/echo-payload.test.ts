import { describe, test, expect } from 'vitest'
import { WhatsAppPayloadSchema } from '../misc/types'

/**
 * Reproduction for SHK-1506: coexistence echoes (smb_message_echoes) rejected with HTTP 500.
 *
 * The webhook handler (handler.ts:43) runs `WhatsAppPayloadSchema.parse(data)` on the whole
 * request body before dispatching. If it throws, the handler returns HTTP 500 (handler.ts:44-46).
 * So any realistic echo payload that fails Zod validation surfaces as a 500 in production.
 *
 * These payloads are modeled on Meta's real `smb_message_echoes` webhooks, sent when the business
 * user replies to a customer from the WhatsApp Business App on their phone.
 */

// A realistic text echo exactly as Meta delivers it: it does NOT include `message_creation_type`.
const realisticTextEcho = {
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
            message_echoes: [
              {
                from: '15550001111', // the business number
                to: '14169385443', // the customer
                id: 'wamid.HBgLMTQxNjkzODU0NDMVAgARGBI5QTND',
                timestamp: '1719421200',
                type: 'text',
                text: {
                  body: 'Hi! Thanks for reaching out, this is a human replying.',
                },
              },
            ],
          },
          field: 'smb_message_echoes',
        },
      ],
    },
  ],
}

describe('smb_message_echoes payload validation (SHK-1506)', () => {
  test('a realistic text echo from Meta parses (no message_creation_type field)', () => {
    // Meta never sends `message_creation_type`; before the fix this rejected -> HTTP 500.
    const result = WhatsAppPayloadSchema.safeParse(realisticTextEcho)
    expect(result.success).toBe(true)
  })

  test('an echo THAT happens to include message_creation_type still parses', () => {
    const withCreationType = structuredClone(realisticTextEcho)
    ;(withCreationType.entry[0]!.changes[0]!.value.message_echoes[0]! as any).message_creation_type =
      'created_by_1p_bot'

    const result = WhatsAppPayloadSchema.safeParse(withCreationType)
    expect(result.success).toBe(true)
  })

  test('an image echo (no message_creation_type) parses', () => {
    const imageEcho = structuredClone(realisticTextEcho)
    const echo = imageEcho.entry[0]!.changes[0]!.value.message_echoes[0]! as any
    delete echo.text
    echo.type = 'image'
    echo.image = { sha256: 'abc123', id: '1234567890', mime_type: 'image/jpeg' }

    const result = WhatsAppPayloadSchema.safeParse(imageEcho)
    expect(result.success).toBe(true)
  })
})
