import { describe, expect, test } from 'vitest'
import {
  markdownHtmlToTelegramPayloads,
  MarkdownToTelegramHtmlResult,
  MixedPayloads,
  stdMarkdownToTelegramHtml,
} from './markdown-to-telegram-html'
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
    expects: '<pre><code>console.log("Code Block")\n</code></pre>',
    description: 'Apply code block style to text - Without language',
  },
  {
    input: '```typescript\nconsole.log("Code Block")\n```',
    expects: '<pre><code class="language-typescript">console.log("Code Block")\n</code></pre>',
    description: 'Apply code block style to text - With language',
  },
  {
    input: '\tconsole.log("Indented Code Block")',
    expects: '<pre><code>console.log("Indented Code Block")\n</code></pre>',
    description: 'Apply alternative code block style to text using indentation',
  },
  {
    input: '> Blockquote',
    expects: '<blockquote>\n\nBlockquote\n</blockquote>',
    description: 'Apply blockquote style to text',
  },
  {
    input: '[Hyperlink](https://www.botpress.com/)',
    expects: '<a href="https://www.botpress.com/">Hyperlink</a>',
    description: 'Convert hyperlink markup to html link',
  },
  {
    input: '[Hyperlink](https://www.botpress.com/ "Tooltip Title")',
    expects: '<a href="https://www.botpress.com/" title="Tooltip Title">Hyperlink</a>',
    // NOTE: Telegram does not support the title attribute, however, it just ignores it instead of causing a crash
    description: 'Markdown hyperlink title gets carried over to html link',
  },
  {
    input: '[Hyperlink][id]\n\n[id]: https://www.botpress.com/  "Tooltip Title"',
    expects: '<a href="https://www.botpress.com/" title="Tooltip Title">Hyperlink</a>',
    // NOTE: Telegram does not support the title attribute, however, it just ignores it instead of causing a crash
    description: 'Convert hyperlink markup using footnote style syntax to html link',
  },
  {
    input: 'https://www.botpress.com/',
    expects: '<a href="https://www.botpress.com/">https://www.botpress.com/</a>',
    description: 'Implicit link gets auto-converted into html link',
  },
  {
    input: '[Phone Number](tel:5141234567)',
    expects: '5141234567',
    description:
      'Convert phone number markdown to plain text phone number (Telegram does not support "tel" links, but will convert phone numbers into links for us)',
  },
  {
    input: '[Phone Number](tel:5141234567 "Tooltip Title")',
    expects: '5141234567',
    description:
      'Convert phone number markdown with title attribute to plain text phone number (Telegram does not support "tel" links, but will convert phone numbers into links for us)',
  },
  {
    input: '[Phone Number][id]\n\n[id]: tel:5141234567  "Tooltip Title"',
    expects: '5141234567',
    description:
      'Convert phone number markdown using footnote style syntax to plain text phone number (Telegram does not support "tel" links, but will convert phone number into links for us)',
  },
  {
    input: '[Botpress Email](mailto:test@botpress.com)',
    expects: 'test@botpress.com',
    description:
      'Convert email markdown to plain text email address (Telegram does not support "mailto" links, but will convert email addresses into links for us)',
  },
  {
    input: '[Botpress Email](mailto:test@botpress.com "Tooltip Title")',
    expects: 'test@botpress.com',
    description:
      'Convert email markdown with title attribute to plain text email address (Telegram does not support "mailto" links, but will convert email addresses into links for us)',
  },
  {
    input: '[Botpress Email][id]\n\n[id]: mailto:test@botpress.com  "Tooltip Title"',
    expects: 'test@botpress.com',
    description:
      'Convert email markdown using footnote style syntax to plain text email address (Telegram does not support "mailto" links, but will convert email addresses into links for us)',
  },
  {
    input:
      '[Botpress Email](mailto:test@botpress.com "Tooltip Title")[Hyperlink](https://www.botpress.com/ "Tooltip Title")',
    expects: 'test@botpress.com<a href="https://www.botpress.com/" title="Tooltip Title">Hyperlink</a>',
    description:
      "Ensure that the mailto/tel replacer doesn't break normal hyperlinks located immediately after it (Checking for race-condition)",
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
            pos: 0,
          },
        ],
      },
    },
    description: 'Markdown images get extracted since Telegram does not support images embedded into text messages',
  },
  {
    input:
      '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")',
    expects: {
      html: '',
      extractedData: {
        images: [
          {
            alt: 'Botpress Brand Logo',
            src: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
            title: 'Title Tooltip Text',
            pos: 0,
          },
        ],
      },
    },
    description: 'Title attribute gets extracted from markdown image',
  },
  // ==== Advanced Tests ====
  {
    input: '> Blockquote Layer 1\n> > Blockquote Layer 2\n> > > Blockquote Layer 3',
    expects:
      '<blockquote>\n\nBlockquote Layer 1\n<blockquote>\n\nBlockquote Layer 2\n<blockquote>\n\nBlockquote Layer 3\n</blockquote>\n</blockquote>\n</blockquote>',
    // NOTE: Telegram does not support nested blockquotes, rather it just flattens it into one layer (No crash)
    description: 'Apply nested blockquotes to text',
  },
  {
    input: '# Header 1\n## Header 2\n### Header 3\n#### Header 4\n##### Header 5\n###### Header 6',
    expects: 'Header 1\nHeader 2\nHeader 3\nHeader 4\nHeader 5\nHeader 6',
    description: 'Remove header styles since Telegram does not support headers',
  },
  {
    input: 'Header 2\n---\nHello World',
    expects: 'Header 2\n\nHello World',
    description: 'Remove alternate header style since Telegram does not support headers',
  },
  {
    input: '(c) (C) (r) (R) (tm) (TM) (p) (P) +-',
    expects: '© © ® ® ™ ™ (p) (P) ±',
    description: 'Convert text into their typographic equivalents',
  },
  {
    input: '!!!!!! ???? ,,',
    expects: '!!! ??? ,',
    description: 'Remove excess characters',
  },
  {
    input: 'Word -- ---',
    expects: 'Word – —',
    description: 'Convert 2 dashes into an "en dash" & 3 dashes into an "em dash" (Must follow a word)',
  },
  {
    input: 'Hello\n\n---\n\nBotpress\n***\nWorld\n___',
    expects: 'Hello\n\n\nBotpress\n\n\nWorld',
    // NOTE: 3 dashes variant requires an additional newline, otherwise it converts into a size 2 header
    description: 'Remove horizontal rules (3 dashes, asterisks, or underscores) since Telegram does not support them',
  },
  {
    input: '"Double quotes" and \'Single quotes\'',
    expects: '“Double quotes” and ‘Single quotes’',
    description: 'Convert double & singles quotes into fancy double & single quotes',
  },
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
    description: 'Markdown that gets cutoff (bold in this case) by another markdown does not convert to html',
  },
  {
    input: '**Hello**\n**World**',
    expects: '<strong>Hello</strong>\n<strong>World</strong>',
    description: 'Multiline styling produces separate html tags for each line',
  },
  {
    input: '- Item 1\n- Item 2\n- Item 3',
    expects: '- Item 1\n- Item 2\n- Item 3',
    description: 'Markdown unordered lists do not convert to html since Telegram does not support them',
  },
  {
    input: '1) Item 1\n2) Item 2\n3) Item 3',
    expects: '1) Item 1\n2) Item 2\n3) Item 3',
    description: 'Markdown ordered lists do not convert to html since Telegram does not support them',
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

  test('Ensure javascript injection via markdown link is not possible', () => {
    const { html } = stdMarkdownToTelegramHtml("[click me](javascript:alert('XSS'))")
    expect(html).toBe('[click me](javascript:alert(‘XSS’))')
  })

  test('Ensure javascript injection via html link is not possible', () => {
    const { html } = stdMarkdownToTelegramHtml('<a href="javascript:alert(\'XSS\')">click me</a>')
    expect(html).toBe('&lt;a href=“javascript:alert(‘XSS’)”&gt;click me&lt;/a&gt;')
  })

  test('Ensure javascript injection via html image handler is not possible', () => {
    const { html } = stdMarkdownToTelegramHtml('<img src="image.jpg" alt="alt text" onerror="alert(\'xss\')">')
    expect(html).toBe('&lt;img src=“image.jpg” alt=“alt text” onerror=“alert(‘xss’)”&gt;')
  })
})

type MarkdownToTelegramHtmlWithExtractedImagesTestCase = TestCase<string, MixedPayloads>

const extractedImagesTestCases: MarkdownToTelegramHtmlWithExtractedImagesTestCase[] = [
  {
    input:
      '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=300 "Title Tooltip Text")',
    expects: [
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
      },
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=300',
      },
    ],
    description: 'Two images get extracted in the correct order',
  },
  {
    input:
      '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")\n\n![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=300 "Title Tooltip Text")',
    expects: [
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
      },
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=300',
      },
    ],
    description: 'Two images with whitespace in between removes whitespace',
  },
  {
    input:
      'Text Before\n![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")',
    expects: [
      {
        type: 'text',
        text: 'Text Before\n',
      },
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
      },
    ],
    description: 'Text followed by an image',
  },
  {
    input:
      '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")\nText in the middle\n![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=300 "Title Tooltip Text")',
    expects: [
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
      },
      {
        type: 'text',
        text: '\nText in the middle\n',
      },
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=300',
      },
    ],
    description: 'Two images with text in the middle',
  },
  {
    input:
      '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")\nText After',
    expects: [
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
      },
      {
        type: 'text',
        text: '\nText After',
      },
    ],
    description: 'Image followed by text',
  },
  {
    input:
      'Text Before\n![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600 "Title Tooltip Text")\nText After',
    expects: [
      {
        type: 'text',
        text: 'Text Before\n',
      },
      {
        type: 'image',
        imageUrl: 'https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600',
      },
      {
        type: 'text',
        text: '\nText After',
      },
    ],
    description: 'Image surrounded by text',
  },
]

describe('Markdown to Telegram HTML Conversion with Extracted Images', () => {
  test.each(extractedImagesTestCases)('$description', ({ input, expects }) => {
    const { html, extractedData } = stdMarkdownToTelegramHtml(input)

    // Every test case should have extracted images
    if (!extractedData.images || extractedData.images.length === 0) {
      throw new Error('The image extraction failed to extract images')
    }

    const payloads = markdownHtmlToTelegramPayloads(html, extractedData.images)

    expect(payloads).toEqual(expects)
  })
})
