import { WhatsAppAPI } from 'whatsapp-api-js'
import { ActionButtons, Body, Button, Interactive, Reaction, Text } from 'whatsapp-api-js/messages'
import { describe, expect, it, vi } from 'vitest'
import { buildBsuidMessageRequest, resolveWhatsAppDestination, sendWhatsAppMessage } from './send-whatsapp-message'

const successResponse = {
  messaging_product: 'whatsapp' as const,
  contacts: [{ input: 'CO.1047385771169864', wa_id: 'CO.1047385771169864' }] as const,
  messages: [{ id: 'wamid.message-id' }] as const,
}

const createClient = () => {
  const sendMessage = vi.fn()
  const apiFetch = vi.fn()
  const client = {
    sendMessage,
    $$apiFetch$$: apiFetch,
  } as unknown as WhatsAppAPI
  return { client, sendMessage, apiFetch }
}

describe('sendWhatsAppMessage', () => {
  it('uses the library sendMessage path for a phone destination', async () => {
    const { client, sendMessage, apiFetch } = createClient()
    const message = new Text('Hello')
    sendMessage.mockResolvedValue(successResponse)

    const response = await sendWhatsAppMessage(
      client,
      'business-phone-id',
      { type: 'phone', phoneNumber: '15551234567' },
      message
    )

    expect(sendMessage).toHaveBeenCalledWith('business-phone-id', '15551234567', message)
    expect(apiFetch).not.toHaveBeenCalled()
    expect(response).toBe(successResponse)
  })

  it('addresses a BSUID with recipient and omits to', async () => {
    const { client, sendMessage, apiFetch } = createClient()
    apiFetch.mockResolvedValue(Response.json(successResponse))

    const response = await sendWhatsAppMessage(
      client,
      'business-phone-id',
      { type: 'bsuid', userId: 'CO.1047385771169864' },
      new Text('Hello')
    )

    expect(sendMessage).not.toHaveBeenCalled()
    expect(apiFetch).toHaveBeenCalledOnce()
    const [url, init] = apiFetch.mock.calls[0]!
    expect(url).toBe('https://graph.facebook.com/v22.0/business-phone-id/messages')
    expect(init).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const body = JSON.parse(init.body)
    expect(body).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'CO.1047385771169864',
      type: 'text',
      text: { body: 'Hello' },
    })
    expect(body).not.toHaveProperty('to')
    expect(response).toEqual(successResponse)
  })

  it('serializes interactive and reaction payloads under their message types', () => {
    const destination = { type: 'bsuid' as const, userId: 'CO.1047385771169864' }
    const interactive = new Interactive(
      new ActionButtons(new Button('yes', 'Yes'), new Button('no', 'No')),
      new Body('Choose')
    )
    const reaction = new Reaction('wamid.incoming', '👀')

    expect(JSON.parse(JSON.stringify(buildBsuidMessageRequest(destination, interactive)))).toMatchObject({
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: 'Choose' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'yes', title: 'Yes' } },
            { type: 'reply', reply: { id: 'no', title: 'No' } },
          ],
        },
      },
    })
    expect(JSON.parse(JSON.stringify(buildBsuidMessageRequest(destination, reaction)))).toMatchObject({
      type: 'reaction',
      reaction: { message_id: 'wamid.incoming', emoji: '👀' },
    })
  })

  it('returns Meta error responses for existing retry and issue handling', async () => {
    const { client, apiFetch } = createClient()
    const errorResponse = {
      error: {
        message: '(#100) Invalid parameter',
        type: 'OAuthException',
        code: 100,
        error_data: { messaging_product: 'whatsapp', details: 'Invalid recipient' },
        error_subcode: 0,
        fbtrace_id: 'trace-id',
      },
    }
    apiFetch.mockResolvedValue(Response.json(errorResponse, { status: 400 }))

    const response = await sendWhatsAppMessage(
      client,
      'business-phone-id',
      { type: 'bsuid', userId: 'CO.1047385771169864' },
      new Text('Hello')
    )

    expect(response).toEqual(errorResponse)
  })
})

describe('resolveWhatsAppDestination', () => {
  it('prefers the phone number when phone and BSUID tags are both present', () => {
    expect(resolveWhatsAppDestination({ userPhone: '15551234567', userId: 'CO.1047385771169864' })).toEqual({
      type: 'phone',
      phoneNumber: '15551234567',
    })
  })

  it('uses the full BSUID when no phone number is present', () => {
    expect(resolveWhatsAppDestination({ userId: 'CO.1047385771169864' })).toEqual({
      type: 'bsuid',
      userId: 'CO.1047385771169864',
    })
  })
})
