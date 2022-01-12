import { formatUrl, parseBotpressMediaUrl } from './url'

describe('URL Formatting', () => {
  const EXTERNAL_URL = 'http://localhost:3000'
  const MEDIA_URL = 'http://media.service'

  it('Validate URL parsing', () => {
    const result = parseBotpressMediaUrl('/api/v1/bots/welcome-bot/media/abc123.png')
    expect(result).toEqual({
      isBotpressUrl: true,
      botId: 'welcome-bot',
      mediaId: 'abc123.png'
    })
  })

  it('Basic URL', () => {
    const result = formatUrl(EXTERNAL_URL, '/api/v1/bots/welcome-bot/media/abc123.png')
    expect(result).toBe(`${EXTERNAL_URL}/api/v1/bots/welcome-bot/media/abc123.png`)
  })

  it('Not a Botpress URL', () => {
    const result = formatUrl(EXTERNAL_URL, 'http://google.com/images/abc123.png')
    expect(result).toBe('http://google.com/images/abc123.png')
  })

  it('With a custom media URL', () => {
    const result = formatUrl(EXTERNAL_URL, '/api/v1/bots/welcome-bot/media/abc123.png', MEDIA_URL)
    expect(result).toBe(`${MEDIA_URL}/welcome-bot/abc123.png`)
  })
})
