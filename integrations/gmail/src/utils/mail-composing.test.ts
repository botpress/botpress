import { describe, it, expect } from 'vitest'
import { composeRawEmail, generateMarkdownMessage } from './mail-composing'

const SAMPLE_MARKDOWN = [
  '# Welcome to Botpress',
  '',
  'This is a **test email** to check *markdown formatting*.',
  '',
  '- First item',
  '- Second item',
  '',
  '[link to Botpress](https://botpress.com)',
].join('\n')

const _decodeBase64Url = (raw: string): string =>
  Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')

describe('generateMarkdownMessage', () => {
  const html = generateMarkdownMessage({ markdown: SAMPLE_MARKDOWN })

  it('renders a heading', () => {
    expect(html).toContain('<h1')
    expect(html).toContain('Welcome to Botpress')
  })

  it('renders bold and italic emphasis', () => {
    expect(html).toContain('<strong')
    expect(html).toContain('<em')
  })

  it('renders list items', () => {
    expect(html).toContain('<li')
    expect(html).toContain('First item')
  })

  it('renders links', () => {
    expect(html).toContain('<a')
    expect(html).toContain('https://botpress.com')
  })

  it('does not leave raw markdown syntax in the output', () => {
    expect(html).not.toContain('**test email**')
    expect(html).not.toContain('# Welcome')
  })
})

describe('composeRawEmail', () => {
  it('produces a multipart message that includes the rendered HTML part', async () => {
    const html = generateMarkdownMessage({ markdown: SAMPLE_MARKDOWN })
    const raw = await composeRawEmail({
      to: 'recipient@example.com',
      subject: 'Test',
      text: SAMPLE_MARKDOWN,
      html,
      textEncoding: 'base64',
    })

    const decoded = _decodeBase64Url(raw)
    expect(decoded).toContain('text/html')
    expect(decoded).toContain('text/plain')
    expect(decoded).toContain('Welcome to Botpress')
  })
})
