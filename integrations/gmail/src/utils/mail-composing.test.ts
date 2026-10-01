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

describe('markdown normalization', () => {
  it('renders block structure when separator lines contain whitespace (LLM/pipeline output)', () => {
    // "Blank" lines contain a space and content lines are indented — the shape real LLM output arrives in.
    const md = ['# Title', ' ', '  Intro paragraph.', ' ', '  - one', ' ', '  - two', ' ', '  > a quote'].join('\n')
    const html = generateMarkdownMessage({ markdown: md })
    expect(html).toContain('<ul')
    expect(html).toContain('<li')
    expect(html).toContain('<blockquote')
  })

  it('preserves nested-list indentation (whitespace-sensitive)', () => {
    const md = ['- parent', '  - child', '  - child two'].join('\n')
    const html = generateMarkdownMessage({ markdown: md })
    // A nested list produces a <ul> inside an <li>, i.e. more than one <ul>.
    expect(html.split('<ul').length - 1).toBeGreaterThanOrEqual(2)
  })

  it('preserves indented/fenced code content (whitespace-sensitive)', () => {
    const md = ['```', 'function f() {', '  return 1', '}', '```'].join('\n')
    const html = generateMarkdownMessage({ markdown: md })
    expect(html).toContain('<code')
    // The two-space indentation inside the code block must survive normalization.
    expect(html).toContain('  return 1')
  })

  it('preserves trailing-space hard breaks (renders as <br>)', () => {
    const md = 'line one  \nline two'
    const html = generateMarkdownMessage({ markdown: md })
    // Normalization leaves the two trailing spaces intact, so the hard break renders as <br>.
    expect(html).toMatch(/line one<br\s*\/?>line two/)
  })
})

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
