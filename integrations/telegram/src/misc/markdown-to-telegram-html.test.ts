import { describe, expect, test } from 'vitest'
import { MarkdownToTelegramHtmlResult, stdMarkdownToTelegramHtml } from './markdown-to-telegram-html'
import { TestCase } from '../../tests/types'

type MarkdownToTelegramHtmlTestCase = TestCase<string, string> | TestCase<string, MarkdownToTelegramHtmlResult>

const markdownToTelegramHtmlTestCases: MarkdownToTelegramHtmlTestCase[] = [
  // ==== Testing each mark type ====
  {
    input: '**Bold**',
    expects: '<strong>Bold</strong>',
    description: 'Apply bold style to text',
  },
  {
    input: '__Bold__',
    expects: '<strong>Bold</strong>',
    description: 'Alternative apply bold style to text',
  },
  {
    input: '*Italic*',
    expects: '<em>Italic</em>',
    description: 'Apply italic style to text',
  },
  {
    input: '_Italic_',
    expects: '<em>Italic</em>',
    description: 'Alternative apply italic style to text',
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
  {
    input: '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600)',
    expects: {
      html: '',
      extractedData: {
        images: [
          {
            alt: 'Botpress Brand Logo',
            src: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
          },
        ],
      },
    },
    description: 'Markdown images get extracted since Telegram does not support images embedded into text messages',
  },
  // ==== Advanced Tests ====
  {
    input: '**~~Bold-Strike~~**',
    expects: '<strong><s>Bold-Strike</s></strong>',
    description: 'Multiple nested effects all get applied',
  },
  {
    input: '`**Code-Bold**`',
    expects: '<code>**Code-Bold**</code>',
    description: 'Markdown nested within a code snippet does not get converted to HTML',
  },
  {
    input: '```\n**CodeBlock-Bold**\n```',
    expects: '<pre><code>**CodeBlock-Bold**\n</code></pre>',
    description: 'Markdown nested within a code block does not get converted to HTML',
  },
  {
    input: 'This is line one.  \nThis is line two.',
    expects: 'This is line one.\n\nThis is line two.',
    description: 'Converts hardbreak into multiple newlines',
  },
  {
    input: '_cut**off_**',
    expects: '<em>cut**off</em>**',
    description: 'Markdown that gets cutoff by another markdown does not convert to html',
  },
  {
    input: '**Hello**\n**World**',
    expects: '<strong>Hello</strong>\n<strong>World</strong>',
    description: 'Multiline styling produces separate html tags for each line',
  },
  {
    input: '- Item 1\n- Item 2\n- Item 3',
    expects: '- Item 1\n- Item 2\n- Item 3',
    description: 'Markdown lists do not convert to html since Telegram does not support them',
  },
  {
    input: '| Item 1 | Item 2 | Item 3 |\n| - | - | - |\n| Value 1 | Value 2 | Value 3 |',
    expects: '| Item 1 | Item 2 | Item 3 |\n| - | - | - |\n| Value 1 | Value 2 | Value 3 |',
    description: 'Markdown tables do not convert to html since Telegram does not support them',
  },
]

describe('Standard Markdown to Telegram HTML Conversion', () => {
  markdownToTelegramHtmlTestCases.forEach(
    ({ input, expects, description, skip = false }: MarkdownToTelegramHtmlTestCase) => {
      test.skipIf(skip)(description, () => {
        const { html, extractedData } = stdMarkdownToTelegramHtml(input)

        if (typeof expects === 'string') {
          expect(html).toBe(expects)
        } else {
          expect(html).toBe(expects.html)
          expect(extractedData).toEqual(expects.extractedData)
        }
      })
    }
  )
})
