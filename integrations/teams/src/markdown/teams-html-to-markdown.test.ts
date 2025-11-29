import { describe, expect, test } from 'vitest'
import { TestCase } from '../types'
import { transformTeamsHtmlToStdMarkdown } from './teams-html-to-markdown'

type TeamsHtmlToMarkdownTestCase = TestCase<string, string> | TestCase<string[], string>

const teamsHtmlToMarkdownTestCases: TestCase<string, string>[] = (
  [
    // ----- Bold -----
    {
      input: ['<b>Bold</b>', '<strong>Bold</strong>'],
      expects: '**Bold**',
      description: 'Convert bold tag to markdown',
    },
    // ----- Italic -----
    {
      input: ['<i>Italic</i>', '<em>Italic</em>'],
      expects: '_Italic_',
      description: 'Convert italic tag to markdown',
    },
    // ----- Strikethrough -----
    {
      input: ['<s>Strike</s>', '<del>Strike</del>'],
      expects: '~~Strike~~',
      description: 'Convert strikethrough tag to markdown',
    },
    // ----- Headings & Paragraph -----
    {
      input: '<h1>Heading 1</h1>',
      expects: '# Heading 1',
      description: 'Convert h1 tag to heading markdown',
    },
    {
      input: '<h2>Heading 2</h2>',
      expects: '## Heading 2',
      description: 'Convert h2 tag to heading markdown',
    },
    {
      input: '<h3>Heading 3</h3>',
      expects: '### Heading 3',
      description: 'Convert h3 tag to heading markdown',
    },
    {
      input: '<h4>Heading 4</h4>',
      expects: '#### Heading 4',
      // Though h4 is not supported by MS Teams, this
      // converter should still handle it correctly
      description: 'Convert h4 tag to heading markdown',
    },
    {
      input: '<h5>Heading 5</h5>',
      expects: '##### Heading 5',
      // Though h5 is not supported by MS Teams, this
      // converter should still handle it correctly
      description: 'Convert h5 tag to heading markdown',
    },
    {
      input: '<h6>Heading 6</h6>',
      expects: '###### Heading 6',
      // Though h6 is not supported by MS Teams, this
      // converter should still handle it correctly
      description: 'Convert h6 tag to heading markdown',
    },
    {
      input: '<p>Paragraph</p>',
      expects: 'Paragraph',
      description: 'Convert paragraph tag to markdown',
    },
    // ----- Horizontal Rule -----
    {
      input: 'Horizontal Rule<hr />',
      expects: 'Horizontal Rule\n\n---',
      // Requires 2 new lines before horizontal rule
      // markdown otherwise it becomes a heading mark
      description: 'Convert horizontal rule tag to markdown',
    },
    // ----- Inline Code -----
    {
      input: '<code>Code Snippet</code>',
      expects: '`Code Snippet`',
      description: 'Convert inline code html to markdown',
    },
    // ----- Code Blocks -----
    {
      input: '<pre><code>console.log("Code Block")</code></pre>',
      expects: '```\nconsole.log("Code Block")\n```',
      description: 'Convert code block html to markdown - Without language',
    },
    {
      input: '<pre class="language-javascript"><code>console.log("Code Block")</code></pre>',
      expects: '```javascript\nconsole.log("Code Block")\n```',
      description: 'Convert code block html to markdown - With language',
    },
    // ----- Lists -----
    {
      input: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
      expects: '- Item 1\n- Item 2\n- Item 3',
      description: 'Convert unordered list HTML to markdown list',
    },
    {
      input: '<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>',
      expects: '1. Item 1\n2. Item 2\n3. Item 3',
      description: 'Convert ordered list HTML to markdown list',
    },
    // ----- Tables -----
    {
      input: [
        // With thead/tbody
        '<table><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td>Row 1, Cell 1</td><td>Row 1, Cell 2</td><td>Row 1, Cell 3</td></tr><tr><td>Row 2, Cell 1</td><td>Row 2, Cell 2</td><td>Row 2, Cell 3</td></tr><tr><td>Row 3, Cell 1</td><td>Row 3, Cell 2</td><td>Row 3, Cell 3</td></tr></tbody></table>',
        // Without thead/tbody
        '<table><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr><tr><td>Row 1, Cell 1</td><td>Row 1, Cell 2</td><td>Row 1, Cell 3</td></tr><tr><td>Row 2, Cell 1</td><td>Row 2, Cell 2</td><td>Row 2, Cell 3</td></tr><tr><td>Row 3, Cell 1</td><td>Row 3, Cell 2</td><td>Row 3, Cell 3</td></tr></table>',
        // Actual MS Teams table created by user
        '<p>&nbsp;</p>\n<table>\n<tbody>\n<tr>\n<td>\n<p>Header 1</p>\n</td>\n<td>\n<p>Header 2</p>\n</td>\n<td>\n<p>Header 3</p>\n</td>\n</tr>\n<tr>\n<td>\n<p>Row 1, Cell 1</p>\n</td>\n<td>\n<p>Row 1, Cell 2</p>\n</td>\n<td>\n<p>Row 1, Cell 3</p>\n</td>\n</tr>\n<tr>\n<td>\n<p>Row 2, Cell 1</p>\n</td>\n<td>\n<p>Row 2, Cell 2</p>\n</td>\n<td>\n<p>Row 2, Cell 3</p>\n</td>\n</tr>\n<tr>\n<td>\n<p>Row 3, Cell 1</p>\n</td>\n<td>\n<p>Row 3, Cell 2</p>\n</td>\n<td>\n<p>Row 3, Cell 3</p>\n</td>\n</tr>\n</tbody>\n</table>\n<p>&nbsp;</p>',
      ],
      expects:
        '| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Row 1, Cell 1 | Row 1, Cell 2 | Row 1, Cell 3 |\n| Row 2, Cell 1 | Row 2, Cell 2 | Row 2, Cell 3 |\n| Row 3, Cell 1 | Row 3, Cell 2 | Row 3, Cell 3 |',
      // NOTE: This converter cannot support "Editable"/"FluidEmbedCard" tables since there is no way to access the content of those cards (Last checked: 2025-11-25)
      description: 'Convert table HTML to markdown table',
    },
    // ----- Blockquote -----
    {
      input: [
        '<blockquote>\n\nBlockquote\n</blockquote>',
        // Actual Teams HTML output for blockquote
        '<blockquote>\n<p>Blockquote</p>\n</blockquote>\n<p>&nbsp;</p>',
      ],
      expects: '> Blockquote',
      description: 'Apply blockquote markdown to text',
    },
    // ----- Hyperlinks -----
    {
      input: '<a href="https://www.botpress.com/">Hyperlink</a>',
      expects: '[Hyperlink](https://www.botpress.com/)',
      description: 'Convert hyperlink html tag without title attribute to markdown',
    },
    {
      input: '<a href="https://www.botpress.com/" title="Test Title">Hyperlink</a>',
      expects: '[Hyperlink](https://www.botpress.com/ "Test Title")',
      description: 'Convert hyperlink html tag with title attribute to markdown',
    },
    // ----- Telephone Hyperlinks -----
    {
      input: '<a href=\"tel:1234567890\">Phone Number</a>',
      expects: '[Phone Number](tel:1234567890)',
      // Though telephone links are not currently supported by
      // MS Teams, this converter should still handle it correctly
      description: 'Convert telephone link tag without title attribute to markdown',
    },
    {
      input: '<a href=\"tel:1234567890\" title=\"Telephone Title\">Phone Number</a>',
      expects: '[Phone Number](tel:1234567890 "Telephone Title")',
      // Though telephone links are not currently supported by
      // MS Teams, this converter should still handle it correctly
      description: 'Convert telephone link tag with title attribute to markdown',
    },
    // ----- Email Hyperlinks -----
    {
      input: '<a href=\"mailto:test@botpress.com\">Test Email Address</a>',
      expects: '[Test Email Address](mailto:test@botpress.com)',
      description: 'Convert email address link tag without title attribute to markdown',
    },
    {
      input: [
        '<a href=\"mailto:test@botpress.com\" title=\"mailto:test@botpress.com\">Test Email Address</a>',
        // Actual Teams HTML output for email address
        '<p><a href=\"mailto:test@botpress.com\" rel=\"noreferrer noopener\" title=\"mailto:test@botpress.com\" target=\"_blank\">Test Email Address</a></p>',
      ],
      expects: '[Test Email Address](mailto:test@botpress.com "mailto:test@botpress.com")',
      description: 'Convert email address link tag with title attribute to markdown',
    },
    // ----- Image -----
    {
      input: [
        '<img src="https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010" alt="image" />',
        // Actual Teams HTML output for image (with "src" & "itemid" attribute values anonymized)
        '<p>&nbsp;</p>\n<p><img src="https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010" width="572" height="128" alt="image" itemid="some-graph-api-id"></p>',
      ],
      expects: '![image](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010)',
      description: 'Convert image html tag without title attribute to markdown',
    },
    {
      input: [
        '<img src="https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010" alt="image" title="Test Title" />',
        // Actual Teams HTML output for image (with "src" & "itemid" attribute values anonymized & title attribute added)
        '<p>&nbsp;</p>\n<p><img src="https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010" width="572" height="128" alt="image" itemid="some-graph-api-id" title="Test Title"></p>',
      ],
      expects: '![image](https://shop.botpress.com/cdn/shop/files/logo.png?v=1708026010 "Test Title")',
      description: 'Convert image html tag with title attribute to markdown',
    },
    // ----- Unsupported tags -----
    {
      input: '<p><u>Underline</u></p>',
      expects: 'Underline',
      // The standard markdown spec does not support underlines
      description: 'Do not apply unsupported underline effect',
    },
    // ===== Advanced test cases =====
    {
      input: '<b>a</b><s>b</s><b>c</b><s>d</s><b>e</b><s>f</s><b>g</b><s>h</s',
      expects: '**a**~~b~~**c**~~d~~**e**~~f~~**g**~~h~~',
      description: 'Convert contiguous non-overlapping html effects into separate markdown effects',
    },
    {
      input: '<b>Hello</b> New <s>World</s>',
      expects: '**Hello** New ~~World~~',
      description: 'Convert non-overlapping effects with gap into separate markdown effects',
    },
    {
      input: '<s><b>Multiple Effects</b></s>',
      expects: '~~**Multiple Effects**~~',
      description: 'Convert nested effects on the same range correctly',
    },
    {
      input: '<p><strong>Hello </strong><i><strong>New</strong> World</i></p>',
      expects: '**Hello** _**New** World_',
      description: 'Convert encapsulated nested effects corrrectly',
    },
    {
      input: '<i><s><b>Multiple Effects</b></s></i>',
      expects: '_~~**Multiple Effects**~~_',
      description: 'Convert multiple effects on the same range into nested markdown effects correctly',
    },
    {
      input: '<b>Unterminated Bold',
      expects: '**Unterminated Bold**',
      description: 'Convert bold html tag without closing tag to markdown',
    },
    {
      input: '<blockquote>Hello</blockquote>\nNothing\n<blockquote>More Quotes!</blockquote>',
      expects: '> Hello\n\nNothing\n\n> More Quotes!',
      description: 'Apply blockquote markdown to multiple lines, with non-quote line in between',
    },
    {
      input: '<blockquote>Hello <b>Quote</b> World</blockquote>',
      expects: '> Hello **Quote** World',
      description:
        // An incorrect outcome of this test case would be "> Hello **> Quote**>  World"
        "Ensure any effect nested within blockquote tag doesn't create multiple blockquote marks (It should only ever be at the start of a line)",
    },
    {
      input: '<blockquote>\n<p>Blockquote 1<br>\nBlockquote 2<br>\nBlockquote 3</p>\n</blockquote>\n<p>&nbsp;</p>',
      expects: '> Blockquote 1\n> Blockquote 2\n> Blockquote 3',
      description: 'Multiline blockquote produces a blockquote mark for each line',
    },
    {
      input: '<blockquote>\n<p>Quote Line 1<br>\n<br>\nQuote Line 3</p>\n</blockquote>\n<p>&nbsp;</p>',
      expects: '> Quote Line 1\n> \n> Quote Line 3',
      description: 'Multiline blockquote produces a blockquote mark for each line, with empty lines',
    },
    {
      input: [
        '<blockquote><strong>Quote Line 1</strong><br>\n<br>\n<strong>Quote Line 3</strong>\n<p>&nbsp;</p>\n</blockquote>\n<p>&nbsp;</p>',
        '<blockquote>\n<p><strong>Quote Line 1</strong><br>\n<br>\n<strong>Quote Line 3</strong></p>\n</blockquote>\n<p>&nbsp;</p>',
      ],
      expects: '> **Quote Line 1**\n> \n> **Quote Line 3**',
      description:
        'Multiline blockquote produces a blockquote mark for each line, with empty lines and intersecting effect',
    },
    {
      input: '<p><a href=\"https://www.botpress.com/\">Some <strong>Hyperlink</strong></a></p>',
      expects: '[Some **Hyperlink**](https://www.botpress.com/)',
      description: 'Convert hyperlink with partial bold effect on link text to markdown (without title attribute)',
    },
    {
      input:
        '<p><a href=\"https://www.botpress.com/\" title=\"https://www.botpress.com/\">Some <strong>Hyperlink</strong></a></p>',
      expects: '[Some **Hyperlink**](https://www.botpress.com/ "https://www.botpress.com/")',
      description: 'Convert hyperlink with partial bold effect on link text to markdown (with title attribute)',
    },
    {
      input: '<a href="javascript:console.log(\'XSS Attack\')">Click Me</a>',
      expects: 'Click Me',
      description: 'Strip hyperlink with XSS logic in href attribute',
    },
    {
      input: '<img src="image.jpg" alt="alt text" onerror="alert(\'xss\')" />',
      expects: '![alt text](image.jpg)',
      description: 'Strip image with XSS logic in onerror attribute',
    },
  ] as TeamsHtmlToMarkdownTestCase[]
).reduce(
  (testCases, testCase) => {
    const { input, expects, description } = testCase
    if (typeof input === 'string') {
      return testCases.concat({
        input,
        expects,
        description,
      })
    } else if (Array.isArray(input)) {
      return testCases.concat(
        input.map((inputVariant) => {
          return {
            input: inputVariant,
            expects,
            description,
          }
        })
      )
    }

    return testCases
  },
  [] as TestCase<string, string>[]
)

describe('Teams Html to Markdown Conversion', () => {
  test.each(teamsHtmlToMarkdownTestCases)('$description', ({ input, expects }: TestCase<string, string>) => {
    const markdown = transformTeamsHtmlToStdMarkdown(input)
    expect(markdown).toBe(expects)
  })
})
