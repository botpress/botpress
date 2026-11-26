import { Readable } from 'stream'
import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import axios from 'axios'
import { SlackClient } from '../../slack-api/slack-client'
import { createImageDownloader } from './download-image'

vi.mock('axios', () => ({ default: { put: vi.fn() } }))
vi.mock('../../slack-api/slack-client', () => ({
  SlackClient: { createFromStates: vi.fn() },
}))

const image = {
  id: 'F123',
  mimetype: 'image/png',
  size: 123,
  url_private: 'https://files.slack.com/private',
  url_private_download: 'https://files.slack.com/download',
} as Parameters<ReturnType<typeof createImageDownloader>>[0]
const upsertFile = vi.fn()
const downloadFile = vi.fn()
const props = (configuration = {}) =>
  ({
    client: { upsertFile },
    ctx: { configuration },
    logger: {},
  }) as unknown as Parameters<typeof createImageDownloader>[0]

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
  upsertFile.mockResolvedValue({
    file: {
      url: 'https://files.botpress.cloud/image',
      uploadUrl: 'https://upload/image',
    },
  })
  downloadFile.mockResolvedValue(Readable.from(['image bytes']))
  vi.mocked(SlackClient.createFromStates).mockResolvedValue({
    downloadFile,
    getTeamId: () => 'T123',
  } as unknown as SlackClient)
  vi.mocked(axios.put).mockResolvedValue({})
})
afterEach(() => vi.useRealTimers())

test('stores private images with public access and a default 30-day expiry', async () => {
  const url = await createImageDownloader(props())(image)
  expect(url).toBe('https://files.botpress.cloud/image')
  expect(downloadFile).toHaveBeenCalledWith(image.url_private_download)
  expect(upsertFile).toHaveBeenCalledWith(
    expect.objectContaining({
      key: 'slack-image_T123_F123',
      contentType: 'image/png',
      size: 123,
      expiresAt: '2026-12-20T12:00:00.000Z',
      accessPolicies: ['public_content'],
      publicContentImmediatelyAccessible: true,
    })
  )
  expect(axios.put).toHaveBeenCalledWith(
    'https://upload/image',
    expect.any(Readable),
    expect.objectContaining({
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': 123,
        'x-amz-tagging': 'public=true',
      },
    })
  )
})

test.each([
  [24, '2026-11-21T12:00:00.000Z'],
  [0, undefined],
])('applies expiry %s', async (hours, expected) => {
  await createImageDownloader(props({ downloadedMediaExpiry: hours }))(image)
  expect(upsertFile.mock.calls[0]![0].expiresAt).toBe(expected)
})

test('retains Slack permalink when downloading is disabled', async () => {
  const url = await createImageDownloader(props({ downloadMedia: false }))({
    ...image,
    permalink_public: 'https://slack.com/permalink',
  })
  expect(url).toBe('https://slack.com/permalink')
  expect(upsertFile).not.toHaveBeenCalled()
  expect(SlackClient.createFromStates).not.toHaveBeenCalled()
})

test('shares an upload across repeated deliveries within one event', async () => {
  const download = createImageDownloader(props())
  await Promise.all([download(image), download(image)])
  expect(upsertFile).toHaveBeenCalledTimes(1)
  expect(downloadFile).toHaveBeenCalledTimes(1)
})

test('falls back to the private URL when the download URL is absent', async () => {
  await createImageDownloader(props())({
    ...image,
    url_private_download: undefined,
  })
  expect(downloadFile).toHaveBeenCalledWith(image.url_private)
})

test('rejects an image with no download URL', async () => {
  await expect(
    createImageDownloader(props())({
      ...image,
      url_private_download: undefined,
      url_private: undefined,
    })
  ).rejects.toThrow('no private download URL')
  expect(upsertFile).not.toHaveBeenCalled()
})

test('propagates download failures without using the Slack permalink', async () => {
  downloadFile.mockRejectedValue(new Error('Download failed'))
  await expect(createImageDownloader(props())(image)).rejects.toThrow('Download failed')
  expect(axios.put).not.toHaveBeenCalled()
})

test('redacts upload errors and closes the download stream', async () => {
  const stream = Readable.from(['bytes'])
  downloadFile.mockResolvedValue(stream)
  vi.mocked(axios.put).mockRejectedValue(new Error('secret upload URL'))
  await expect(createImageDownloader(props())(image)).rejects.toThrow(
    'Failed to upload incoming Slack image to the Files API'
  )
  expect(stream.destroyed).toBe(true)
})
