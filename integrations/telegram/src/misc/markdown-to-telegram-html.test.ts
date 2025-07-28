import { describe, expect, test } from 'vitest'
import { stdMarkdownToTelegramHtml } from './markdown-to-telegram-html'
import { TestCase } from '../../tests/types'

type MarkdownToTelegramHtmlTestCase = TestCase<string, string>

const markdownToTelegramHtmlTestCases: MarkdownToTelegramHtmlTestCase[] = [
  // ==== Testing each mark type ====
  {
    input: '**Bold**',
    expects: '<strong>Bold</strong>',
    description: 'Apply bold style to text',
  },
  {
    input: '*Italic*',
    expects: '<em>Italic</em>',
    description: 'Apply italic style to text',
  },
  {
    input: '~~Strike~~',
    expects: '<s>Strike</s>',
    description: 'Apply strikethrough style to text',
  },
  {
    input: '||Spoiler||',
    expects: '<tg-spoiler>Spoiler</tg-spoiler>',
    description: 'Apply spoiler style to text',
    skip: true, // Why? - Feature is not yet implemented
  },
  {
    input: '`Code Snippet`',
    expects: '<code>Code Snippet</code>',
    description: 'Apply code style to text',
  },
  {
    input: '```\nconsole.log("Code Block")\n```',
    expects: '<pre><code>console.log(&quot;Code Block&quot;)\n</code></pre>',
    description: 'Apply code block style to text - Without language',
  },
  {
    input: '```typescript\nconsole.log("Code Block")\n```',
    expects: '<pre><code class="language-typescript">console.log(&quot;Code Block&quot;)\n</code></pre>',
    description: 'Apply code block style to text - With language',
  },
  {
    input: '> Blockquote',
    expects: '<blockquote>\n\nBlockquote\n</blockquote>',
    description: 'Apply blockquote style to text',
  },
  {
    input: '[Hyperlink](https://www.botpress.com/)',
    expects: '<a href="https://www.botpress.com/">Hyperlink</a>',
    description: 'Convert hyperlink markup to website link',
  },
  {
    input: '[Phone Number](tel:5141234567)',
    expects: '<a href="tel:5141234567">Phone Number</a>',
    description: 'Convert phone number markup to phone number link',
  },
  {
    input: '[Botpress Email](mailto:test@botpress.com)',
    expects: '<a href="mailto:test@botpress.com">Botpress Email</a>',
    description: 'Convert email markup to email link',
  },
  // ==== Advanced Tests ====
  {
    input: 'This is line one.  \nThis is line two.',
    expects: 'This is line one.\nThis is line two.',
    description: 'Converts hardbreak into softbreak',
  },
]

describe('Standard Markdown to Telegram HTML Conversion', () => {
  markdownToTelegramHtmlTestCases.forEach(
    ({ input, expects, description, skip = false }: MarkdownToTelegramHtmlTestCase) => {
      test.skipIf(skip)(description, () => {
        expect(stdMarkdownToTelegramHtml(input).html).toBe(expects)
      })
    }
  )
})
