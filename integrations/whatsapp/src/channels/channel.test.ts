import { beforeEach, describe, expect, it, vi } from 'vitest'
import { channel } from './channel'

const sendMessage = vi.fn()

vi.mock('../auth', () => ({
  getAuthenticatedWhatsappClient: vi.fn(async () => ({ sendMessage })),
}))

const AUDIO_URL = 'https://example.com/voice.ogg'

const buildProps = () => {
  const noop = () => {}
  const forBot = () => ({ info: noop, warn: noop, error: noop, debug: noop })
  return {
    client: {},
    ctx: {},
    conversation: { id: 'conv-1', tags: { botPhoneNumberId: 'bot-phone-id', userPhone: '15551234567' } },
    message: { id: 'msg-1' },
    ack: vi.fn(),
    logger: { forBot },
  } as any
}

const sentBody = () => JSON.parse(JSON.stringify(sendMessage.mock.calls[0]![2]))

describe.each([
  {
    handler: 'audio',
    send: (voice?: boolean) => channel.messages!.audio({ ...buildProps(), payload: { audioUrl: AUDIO_URL, voice } }),
  },
  {
    handler: 'bloc',
    send: (voice?: boolean) =>
      channel.messages!.bloc({
        ...buildProps(),
        payload: { items: [{ type: 'audio', payload: { audioUrl: AUDIO_URL, voice } }] },
      }),
  },
])('$handler handler audio body', ({ send }) => {
  beforeEach(() => {
    sendMessage.mockReset()
    sendMessage.mockResolvedValue({ messaging_product: 'whatsapp', messages: [{ id: 'wamid.1' }] })
  })

  it('sets voice when voice is true', async () => {
    await send(true)
    expect(sentBody()).toEqual({ link: AUDIO_URL, voice: true })
  })

  it('omits voice when voice is not set', async () => {
    await send(undefined)
    expect(sentBody()).toEqual({ link: AUDIO_URL })
  })

  it('omits voice when voice is false', async () => {
    await send(false)
    expect(sentBody()).toEqual({ link: AUDIO_URL })
  })
})
