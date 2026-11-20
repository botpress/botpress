import { beforeEach, expect, test, vi } from 'vitest'
import { handleEvent, HandleEventProps } from './message-received'

const { downloadImage, getOrCreateMessage } = vi.hoisted(() => ({
  downloadImage: vi.fn(),
  getOrCreateMessage: vi.fn(),
}))
vi.mock('./download-image', () => ({
  createImageDownloader: () => downloadImage,
}))
vi.mock('../../misc/utils', () => ({
  getBotpressUserFromSlackUser: async () => ({ botpressUser: { id: 'user' } }),
  updateBotpressUserFromSlackUser: async () => {},
  getBotpressConversationFromSlackThread: async () => ({
    botpressConversation: { id: 'channel' },
  }),
}))

const image = {
  id: 'F123',
  mimetype: 'image/png',
  url_private: 'https://files.slack.com/private',
}
const audio = {
  id: 'F456',
  mimetype: 'audio/mp3',
  permalink_public: 'https://slack.com/audio',
}
const props = (files: unknown[], text = '', location = 'channel') =>
  ({
    slackEvent: {
      subtype: 'file_share',
      user: 'U123',
      channel: 'C123',
      ts: '123',
      files,
      text,
    },
    client: {
      getOrCreateMessage,
      getOrCreateConversation: async () => ({ conversation: { id: 'thread' } }),
    },
    ctx: { configuration: { replyBehaviour: { location } } },
    logger: { forBot: () => ({ info: vi.fn(), debug: vi.fn() }) },
  }) as unknown as HandleEventProps

beforeEach(() => {
  vi.resetAllMocks()
  downloadImage.mockResolvedValue('https://files.botpress.cloud/image')
})

test('creates a standalone image using the Files API URL without a public Slack permalink', async () => {
  await handleEvent(props([image]))
  expect(getOrCreateMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'image',
      payload: { imageUrl: 'https://files.botpress.cloud/image' },
    })
  )
})

test('preserves text and other attachment behavior in a bloc', async () => {
  await handleEvent(props([image, audio], 'Caption'))
  expect(getOrCreateMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'bloc',
      payload: {
        items: [
          { type: 'text', payload: { text: 'Caption', mentions: [] } },
          {
            type: 'image',
            payload: { imageUrl: 'https://files.botpress.cloud/image' },
          },
          { type: 'audio', payload: { audioUrl: 'https://slack.com/audio' } },
        ],
      },
    })
  )
  expect(downloadImage).toHaveBeenCalledTimes(1)
})

test('delivers the image to both channel and thread', async () => {
  await handleEvent(props([image], '', 'channelAndThread'))
  expect(getOrCreateMessage).toHaveBeenCalledTimes(2)
  expect(getOrCreateMessage.mock.calls.map(([message]) => message.conversationId)).toEqual(['channel', 'thread'])
})

test('does not create a message when image ingestion fails', async () => {
  downloadImage.mockRejectedValue(new Error('Download failed'))
  await expect(handleEvent(props([image]))).rejects.toThrow('Download failed')
  expect(getOrCreateMessage).not.toHaveBeenCalled()
})
