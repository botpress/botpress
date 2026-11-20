import { Readable } from 'stream'
import { beforeEach, expect, test, vi } from 'vitest'
import axios from 'axios'
import { SlackClient } from './slack-client'

vi.mock('axios', () => ({ default: { get: vi.fn() } }))
vi.mock('./error-handling', () => ({ handleErrorsDecorator: () => () => {}, surfaceSlackErrors: vi.fn() }))
vi.mock('./slack-manifest-client', () => ({ getAppCredentials: async () => ({}) }))
vi.mock('./slack-oauth-client', () => ({
  SlackOAuthClient: class {
    getAuthState = async () => ({
      accessToken: 'test-token',
      scopes: ['files:read'],
      botUserId: 'B123',
      teamId: 'T123',
    })
  },
}))

beforeEach(() => vi.resetAllMocks())
const createClient = () => SlackClient.createFromStates({} as Parameters<typeof SlackClient.createFromStates>[0])

test('downloads with the current OAuth token and streams the response', async () => {
  const stream = Readable.from(['image'])
  vi.mocked(axios.get).mockResolvedValue({ data: stream })
  const slack = await createClient()
  expect(await slack.downloadFile('https://files.slack.com/private')).toBe(stream)
  expect(axios.get).toHaveBeenCalledWith('https://files.slack.com/private', {
    responseType: 'stream',
    headers: { Authorization: 'Bearer test-token' },
  })
})

test('does not expose HTTP request details when a download fails', async () => {
  vi.mocked(axios.get).mockRejectedValue(new Error('Authorization: Bearer secret-token'))
  const slack = await createClient()
  await expect(slack.downloadFile('https://files.slack.com/private')).rejects.toThrow(
    /^Failed to download incoming Slack image$/
  )
})
