import { describe, expect, test } from 'vitest'
import type { TestCase } from '../types'
import { transformMarkdownToTeamsXml } from './markdown-to-teams-xml'
import dedent from 'dedent'

type MarkdownToTeamsHtmlTestCase = TestCase<string, string>

const markdownToTeamsHtmlTestCases: MarkdownToTeamsHtmlTestCase[] = [
  // ----- Bold -----
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
  // ----- Italic -----
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
  // ----- Strikethrough -----
  {
    input: '~~Strike~~',
    expects: '<s>Strike</s>',
    description: 'Apply strikethrough style to text',
  },
  // ----- Code Snippet -----
  {
    input: '`Code Snippet`',
    expects: '<code>Code Snippet</code>',
    description: 'Apply code style to text',
  },
  // ----- Code Blocks -----
  {
    input: '```\nconsole.log("Code Block")\n```',
    expects: '<pre><code>console.log("Code Block")\n</code></pre>',
    description: 'Apply code block style to text - Without language',
  },
  {
    input: '```typescript\nconsole.log("Code Block")\n```',
    expects: '<pre class="language-typescript"><code>console.log("Code Block")\n</code></pre>',
    description: 'Apply code block style to text - With language',
  },
  {
    input: '\tconsole.log("Indented Code Block")',
    expects: '<pre><code>console.log("Indented Code Block")\n</code></pre>',
    description: 'Apply alternative code block style to text using indentation',
  },
  // ----- Blockquote -----
  {
    input: '> Blockquote',
    expects: '<blockquote>\n\nBlockquote\n</blockquote>',
    description: 'Apply blockquote style to text',
  },
  // ----- Headers -----
  {
    input: '# Header 1',
    expects: '<p class="h1"><span style="font-size:1.7em"><b>Header 1</b></span></p>',
    description: 'Apply h1 header style to text',
  },
  {
    input: '## Header 2',
    expects: '<p class="h2"><span style="font-size:1.42em"><b>Header 2</b></span></p>',
    description: 'Apply h2 header style to text',
  },
  {
    input: '### Header 3',
    expects: '<p class="h3"><span style="font-size:1.13em"><b>Header 3</b></span></p>',
    description: 'Apply h3 header style to text',
  },
  {
    input: 'Header 1\n===\nHello World',
    expects: '<p class="h1"><span style="font-size:1.7em"><b>Header 1</b></span></p>\nHello World',
    description: 'Apply alternate h1 header style to text',
  },
  {
    input: 'Header 2\n---\nHello World',
    expects: '<p class="h2"><span style="font-size:1.42em"><b>Header 2</b></span></p>\nHello World',
    description: 'Apply alternate h2 header style to text',
  },
  {
    input: '#### Header 4',
    expects: 'Header 4',
    description: "Don't apply h4 header style to text since Teams doesn't support headers larger than h3",
  },
  {
    input: '##### Header 5',
    expects: 'Header 5',
    description: "Don't apply h5 header style to text since Teams doesn't support headers larger than h3",
  },
  {
    input: '###### Header 6',
    expects: 'Header 6',
    description: "Don't apply h6 header style to text since Teams doesn't support headers larger than h3",
  },
  // ----- Horizontal Rule -----
  // Note: For e2e tests, text is required before the horizontal rule, otherwise nothing is rendered
  {
    input: 'Hello World\n\n---',
    expects: 'Hello World\n<hr />',
    description: 'Insert horizontal rule using dash notation',
  },
  {
    input: 'Hello World\n***',
    expects: 'Hello World\n<hr />',
    description: 'Insert horizontal rule using asterisk notation',
  },
  {
    input: 'Hello World\n___',
    expects: 'Hello World\n<hr />',
    description: 'Insert horizontal rule using underscore notation',
  },
  // ----- Hyperlinks -----
  {
    input: '[Hyperlink](https://www.botpress.com/)',
    expects: '<a href="https://www.botpress.com/">Hyperlink</a>',
    description: 'Convert hyperlink markup to html link',
  },
  {
    input: '[Hyperlink](https://www.botpress.com/ "Tooltip Title")',
    expects: '<a href="https://www.botpress.com/" title="Tooltip Title">Hyperlink</a>',
    // NOTE: Teams does not support the title attribute, however, it just ignores it instead of causing a crash
    description: 'Markdown hyperlink title gets carried over to html link',
  },
  {
    input: '[Hyperlink][id]\n\n[id]: https://www.botpress.com/  "Tooltip Title"',
    expects: '<a href="https://www.botpress.com/" title="Tooltip Title">Hyperlink</a>',
    // NOTE: Teams does not support the title attribute, however, it just ignores it instead of causing a crash
    description: 'Convert hyperlink markup using footnote style syntax to html link',
  },
  {
    input: 'https://www.botpress.com/',
    expects: '<a href="https://www.botpress.com/">https://www.botpress.com/</a>',
    description: 'Implicit link gets auto-converted into html link',
  },
  // ----- Telephone Hyperlinks -----
  {
    input: '[Phone Number](tel:5141234567)',
    expects: 'Phone Number',
    description: 'Strip phone number markdown to plain text phone number since Teams does not support "tel" links',
  },
  {
    input: '[Phone Number](tel:5141234567 "Tooltip Title")',
    expects: 'Phone Number',
    description: 'Strip phone number markdown with title attribute, since Teams does not support "tel" links',
  },
  {
    input: '[Phone Number][id]\n\n[id]: tel:5141234567  "Tooltip Title"',
    expects: 'Phone Number',
    description: 'Strip phone number markdown using footnote style syntax since Teams does not support "tel" links',
  },
  // ----- Email Hyperlinks -----
  {
    input: '[Botpress Email](mailto:test@botpress.com)',
    expects: '<a href="mailto:test@botpress.com">Botpress Email</a>',
    description: 'Convert email link markdown to mailto email link',
  },
  {
    input: '[Botpress Email](mailto:test@botpress.com "Tooltip Title")',
    expects: '<a href="mailto:test@botpress.com" title="Tooltip Title">Botpress Email</a>',
    description: 'Convert email link markdown with title attribute to mailto email link',
  },
  {
    input: '[Botpress Email][id]\n\n[id]: mailto:test@botpress.com  "Tooltip Title"',
    expects: '<a href="mailto:test@botpress.com" title="Tooltip Title">Botpress Email</a>',
    description: 'Convert email link markdown using footnote style syntax to mailto email link',
  },
  // ----- Images -----
  {
    input: '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&width=600)',
    expects:
      '<img src="https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&amp;width=600" alt="Botpress Brand Logo" />',
    description: 'Markdown image is converted to html image with alt text attribute',
  },
  {
    input:
      '![Botpress Brand Logo](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&amp;width=600 "Title Tooltip Text")',
    expects:
      '<img src="https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010&amp;width=600" alt="Botpress Brand Logo" title="Title Tooltip Text" />',
    description: 'Markdown image is converted to html image with alt text & title attributes',
  },
  // ----- Lists -----
  {
    input: '- Item 1\n- Item 2\n- Item 3',
    expects: '<ul>\n<li>\nItem 1\n</li>\n<li>\nItem 2\n</li>\n<li>\nItem 3\n</li>\n</ul>',
    description: 'Markdown unordered lists convert to html unordered lists',
  },
  {
    input: '1) Item 1\n2) Item 2\n3) Item 3',
    expects: '<ol>\n<li>\nItem 1\n</li>\n<li>\nItem 2\n</li>\n<li>\nItem 3\n</li>\n</ol>',
    description: 'Markdown ordered lists convert to html ordered lists',
  },
  {
    input: '- [ ] Foo\n- [x] Bar',
    expects: '<ul>\n<li>\n☐ Foo\n</li>\n<li>\n☑\uFE0E Bar\n</li>\n</ul>',
    description: 'Dashed markdown task lists are converted to lists with checkbox unicode characters',
  },
  {
    input: '1. [ ] Foo\n2. [x] Bar',
    expects: '<ol>\n<li>\n☐ Foo\n</li>\n<li>\n☑\uFE0E Bar\n</li>\n</ol>',
    description: 'Numbered markdown task lists are converted to lists with checkbox unicode characters',
  },
  // ----- Tables -----
  {
    input: '| Item 1 | Item 2 | Item 3 |\n| - | - | - |\n| Value 1 | Value 2 | Value 3 |',
    expects: dedent`
      <table>
      <tr>
      <th>Item 1</th>
      <th>Item 2</th>
      <th>Item 3</th>
      </tr>
      <tr>
      <td>Value 1</td>
      <td>Value 2</td>
      <td>Value 3</td>
      </tr>
      </table>`,
    description: 'Markdown tables convert to html tables',
  },
  // ==== Advanced Tests & Edge Cases ====
  {
    input: '- Item 1\n\t- Item A\n\t- Item B\n- Item 2\n- Item 3',
    expects:
      '<ul>\n<li>\nItem 1<ul>\n<li>\nItem A\n</li>\n<li>\nItem B\n</li>\n</ul>\n\n</li>\n<li>\nItem 2\n</li>\n<li>\nItem 3\n</li>\n</ul>',
    description: 'Nested markdown unordered lists convert to nested html unordered lists',
  },
  {
    input: '1) Item 1\n\t1) Item A\n\t2) Item B\n2) Item 2\n3) Item 3',
    expects:
      '<ol>\n<li>\nItem 1<ol>\n<li>\nItem A\n</li>\n<li>\nItem B\n</li>\n</ol>\n\n</li>\n<li>\nItem 2\n</li>\n<li>\nItem 3\n</li>\n</ol>',
    description: 'Nested markdown ordered lists convert to nested html ordered lists',
  },
  {
    input: '1) Ordered Item 1\n\t- Unordered Item A\n\t- Unordered Item B\n2) Ordered Item 2\n3) Ordered Item 3',
    expects:
      '<ol>\n<li>\nOrdered Item 1<ul>\n<li>\nUnordered Item A\n</li>\n<li>\nUnordered Item B\n</li>\n</ul>\n\n</li>\n<li>\nOrdered Item 2\n</li>\n<li>\nOrdered Item 3\n</li>\n</ol>',
    description:
      'Unordered markdown (md) list nested in ordered md list convert to unordered html list nested in ordered html list',
  },
  {
    input: '- Unordered Item 1\n\t1) Ordered Item A\n\t2) Ordered Item B\n- Unordered Item 2\n- Unordered Item 3',
    expects:
      '<ul>\n<li>\nUnordered Item 1<ol>\n<li>\nOrdered Item A\n</li>\n<li>\nOrdered Item B\n</li>\n</ol>\n\n</li>\n<li>\nUnordered Item 2\n</li>\n<li>\nUnordered Item 3\n</li>\n</ul>',
    description:
      'Ordered markdown (md) list nested in unordered md list converts to ordered html list nested in unordered html list',
  },
  {
    input: '> Blockquote Layer 1\n> > Blockquote Layer 2\n> > > Blockquote Layer 3',
    expects:
      '<blockquote>\n\nBlockquote Layer 1<blockquote>\n\nBlockquote Layer 2<blockquote>\n\nBlockquote Layer 3\n</blockquote>\n</blockquote>\n</blockquote>',
    // This is supported in Teams based on manual testing (Last tested: 2025-11-20)
    description: 'Apply nested blockquotes to text',
  },
  {
    input: '(c) (C) (r) (R) (tm) (TM) +-',
    expects: '© © ® ® ™ ™ ±',
    description: 'Convert text into their typographic equivalents',
  },
  {
    input: 'Word -- ---',
    expects: 'Word – —',
    description: 'Convert 2 dashes into an "en dash" & 3 dashes into an "em dash" (Must follow a word)',
  },
  {
    input: 'Hello\n\n---\n\nBotpress\n***\nWorld\n___',
    expects: 'Hello\n<hr />\nBotpress\n<hr />\nWorld\n<hr />',
    // NOTE: 3 dashes variant requires an additional newline, otherwise it converts into a size 2 header
    description: 'Convert markdown thematic breaks (e.g. 3 dashes, asterisks, or underscores) into horizontal rules',
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
    expects: 'This is line one.<br />\nThis is line two.',
    description: 'Converts hardbreak into <br />',
  },
  {
    input: '_cut**off_**',
    expects: '<em>cut**off</em>**',
    description: 'Markdown that gets cutoff (bold in this case) by another markdown does not convert to html',
  },
  {
    input: '| Item 1 | Item 2 | Item 3 |\n| Value 1 | Value 2 | Value 3 |',
    expects: '| Item 1 | Item 2 | Item 3 |\n| Value 1 | Value 2 | Value 3 |',
    description: 'Markdown table without the splitter row does not convert to html',
  },
  {
    input: '<label><b>Hello World!</b><br /></label>',
    expects: '&lt;label&gt;&lt;b&gt;Hello World!&lt;/b&gt;&lt;br /&gt;&lt;/label&gt;',
    description: 'HTML tags are escaped',
  },
]

describe('Standard Markdown to Teams HTML Conversion', () => {
  markdownToTeamsHtmlTestCases.forEach(({ input, expects, description, skip = false }: MarkdownToTeamsHtmlTestCase) => {
    test.skipIf(skip)(description, () => {
      const html = transformMarkdownToTeamsXml(input)
      expect(html).toBe(expects)
    })
  })

  test('Ensure javascript injection via markdown link is not possible', () => {
    const html = transformMarkdownToTeamsXml("[click me](javascript:alert('XSS'))")
    expect(html).toBe('click me')
  })

  test('Ensure javascript injection via markdown link reference is not possible', () => {
    const html = transformMarkdownToTeamsXml(
      '[click me][id]\n\n[id]: javascript:alert(\'LinkReferenceXSS\')  "Tooltip Title"'
    )
    expect(html).toBe('click me')
  })

  test('Ensure javascript injection via html anchor tag is not possible', () => {
    const html = transformMarkdownToTeamsXml('<a href="javascript:alert(\'XSS\')">click me</a>')
    expect(html).toBe('&lt;a href="javascript:alert(\'XSS\')"&gt;click me&lt;/a&gt;')
  })

  test('Ensure javascript injection via html image tag is not possible', () => {
    const html = transformMarkdownToTeamsXml('<img src="image.jpg" alt="alt text" onerror="alert(\'xss\')">')

    expect(html).toBe('&lt;img src="image.jpg" alt="alt text" onerror="alert(\'xss\')"&gt;')
  })
})
