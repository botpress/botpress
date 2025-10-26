import { test, expect } from 'vitest'
import { parseMarkdown } from './markdown-to-twilio'

const mdGenericTests = {
  Title_1: { input: '# H1', expected: 'H1\n' },
  Title_2: { input: '## H2', expected: 'H2\n' },
  Title_3: { input: '### H3', expected: 'H3\n' },
  Ordered_list: { input: '1. orderedListItem1\n2. item2', expected: '1. orderedListItem1\n2. item2\n' },
  Unordered_list: { input: '- unorderedListItem1\n- item2', expected: '- unorderedListItem1\n- item2\n' },
  Horizontal_rule: { input: 'horizontal\n\n---\n\nrule', expected: 'horizontal\n---\nrule\n' },
  Image: { input: '![image](https://tinyurl.com/mrv4bmyk)', expected: 'https://tinyurl.com/mrv4bmyk\n' },
  Image_with_fallback: { input: '![test](https://tinyurl.com/mrv4bmyk)', expected: 'https://tinyurl.com/mrv4bmyk\n' },
  Table: { input: '| 1 | 2 |\n| - | - |\n| a | b |', expected: '| 1 | 2 |\n| a | b |\n' },
  Footnote: { input: 'footnote[^1]\n\n[^1]: the footnote', expected: 'footnote[1]\n[1] the footnote\n' },
  Definition: { input: 'term\n: definition', expected: 'term\n: definition\n' },
  Task_list: { input: '- [x] taskListItem1\n- [ ] item2', expected: '☑︎ taskListItem1\n☐ item2\n' },
  Emoji_direct: { input: 'emoji direct 😂', expected: 'emoji direct 😂\n' },
  Link: { input: '[title](https://www.example.com)', expected: 'https://www.example.com\n' },
  Link_only: { input: 'https://www.example.com', expected: 'https://www.example.com\n' },
  italic_quote_list: {
    input: `_underscore_\n> quote\n1. item1\n2. item2`,
    expected: 'underscore\nQuote: “quote”\n1. item1\n2. item2\n',
  },
}

const smsSpecificTests = {
  Blockquote: { input: '> blockquote', expected: 'Quote: “blockquote”\n' },
  Code: { input: '`code`', expected: 'code\n' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '{\n\ta: null\n}\n' },
  Bold_with_asterisk: { input: '**bold-asterisk**', expected: 'bold-asterisk\n' },
  Bold_with_underscore: { input: '__bold-underscore__', expected: 'bold-underscore\n' },
  Italic_with_asterisk: { input: '*italic-asterisk*', expected: 'italic-asterisk\n' },
  Italic_with_underscore: { input: '_italic-underscore_', expected: 'italic-underscore\n' },
  Strikethrough: { input: '~~strikethrough~~', expected: 'strikethrough\n' },
}
const smsTests = { ...mdGenericTests, ...smsSpecificTests }
const rcsTests = smsTests

const messengerSpecificTests = {
  Blockquote: { input: '> blockquote', expected: 'blockquote' },
  Code: { input: '`code`', expected: '`code`' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '```\n{\n\ta: null\n}\n```' },
  Bold_with_asterisk: { input: '**bold-asterisk**', expected: '*bold-asterisk*' },
  Bold_with_underscore: { input: '__bold-underscore__', expected: '*bold-underscore*' },
  Italic_with_asterisk: { input: '*italic-asterisk*', expected: '_italic-asterisk_' },
  Italic_with_underscore: { input: '_italic-underscore_', expected: '_italic-underscore_' },
  Strikethrough: { input: '~~strikethrough~~', expected: '~strikethrough~' },
}
const messengerTests = { ...mdGenericTests, ...messengerSpecificTests }

const whatsappSpecificTests = {
  Blockquote: { input: '> blockquote', expected: 'Quote: “blockquote”' },
  Code: { input: '`code`', expected: '`code`' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '```{\n\ta: null\n}```' },
  Bold_with_asterisk: { input: '**bold-asterisk**', expected: '*bold-asterisk*' },
  Bold_with_underscore: { input: '__bold-underscore__', expected: '*bold-underscore*' },
  Italic_with_asterisk: { input: '*italic-asterisk*', expected: '_italic-asterisk_' },
  Italic_with_underscore: { input: '_italic-underscore_', expected: '_italic-underscore_' },
  Strikethrough: { input: '~~strikethrough~~', expected: '~strikethrough~' },
}
const whatsappTests = { ...mdGenericTests, ...whatsappSpecificTests }

test.each(Object.entries(smsTests))(
  '[SMS, MMS] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = parseMarkdown(testValues.input, 'sms/mms')
    expect(actual).toBe(testValues.expected)
  }
)

// test.each(Object.entries(rcsTests))(
//   '[RCS] Test %s',
//   (_testName: string, testValues: { input: string; expected: string }): void => {
//     const actualRcs = parseMarkdown(testValues.input, 'rcs')
//     expect(actualRcs).toBe(testValues.expected)
//   }
// )

// test.each(Object.entries(messengerTests))(
//   '[Messenger] Test %s',
//   (_testName: string, testValues: { input: string; expected: string }): void => {
//     const actual = parseMarkdown(testValues.input, 'messenger')
//     expect(actual).toBe(testValues.expected)
//   }
// )

// test.each(Object.entries(whatsappTests))(
//   '[WhatsApp] Test %s',
//   (_testName: string, testValues: { input: string; expected: string }): void => {
//     const actual = parseMarkdown(testValues.input, 'whatsapp')
//     expect(actual).toBe(testValues.expected)
//   }
// )

const bigInput = `# H1
## H2
### H3
**bold-asterisk**
*italic-asterisk*
__bold-underscore__
_italic-underscore_
> blockquote
1. orderedListItem1
2. item2
- unorderedListItem1
- item2
\`code\`
horizontal

---

rule
[title](https://www.example.com)
![image](https://tinyurl.com/mrv4bmyk)
![test](https://tinyurl.com/mrv4bmyk)
| 1 | 2 |
| - | - |
| a | b |
\`\`\`
{
  a: null
}
\`\`\`
footnote[^1]

[^1]: the footnote

term
: definition
~~strikethrough~~
- [x] taskListItem1
- [ ] item2
emoji direct 😂
`

const expectedForBigInputSMS = `H1
H2
H3
bold-asterisk
italic-asterisk
bold-underscore
italic-underscore
Quote: “blockquote”
1. orderedListItem1
2. item2
- unorderedListItem1
- item2
code
horizontal
---
rule
https://www.example.com
https://tinyurl.com/mrv4bmyk
https://tinyurl.com/mrv4bmyk
| 1 | 2 |
| a | b |
{
  a: null
}
footnote[1]
term
: definition
strikethrough
☑︎ taskListItem1
☐ item2
emoji direct 😂
[1] the footnote\n`
const expectedForBigInputRCS = expectedForBigInputSMS

const expectedForBigInputMessenger = `H1
H2
H3
*bold-asterisk*
_italic-asterisk_
*bold-underscore*
_italic-underscore_
blockquote
1. orderedListItem1\n2. item2
- unorderedListItem1\n- item2
\`code\`
horizontal\n---\nrule
https://www.example.com
https://tinyurl.com/mrv4bmyk
https://tinyurl.com/mrv4bmyk
| 1 | 2 |\n| - | - |\n| a | b |
\`\`\`\n{\n\ta: null\n}\n\`\`\`
footnote[^1]\n[^1]: the footnote
term\n: definition
~strikethrough~
- [x] taskListItem1\n- [ ] item2
emoji direct 😂`

const expectedForBigInputWhatsApp = `H1
H2
H3
*bold-asterisk*
_italic-asterisk_
*bold-underscore*
_italic-underscore_
> blockquote
1. orderedListItem1\n2. item2
- unorderedListItem1\n- item2
\`code\`
horizontal\n---\nrule
https://www.example.com
https://tinyurl.com/mrv4bmyk
https://tinyurl.com/mrv4bmyk
| 1 | 2 |\n| - | - |\n| a | b |
\`\`\`{\n\ta: null\n}\`\`\`
footnote[^1]\n[^1]: the footnote
term\n: definition
~strikethrough~
- [x] taskListItem1\n- [ ] item2
emoji direct 😂`

test('[SMS, MMS] Multi-line multi markup test', () => {
  const actual = parseMarkdown(bigInput, 'sms/mms')
  expect(actual).toBe(expectedForBigInputSMS)
})

// test('[RCS] Multi-line multi markup test', () => {
//   const actualRcs = parseMarkdown(bigInput, 'rcs')
//   expect(actualRcs).toBe(expectedForBigInputRCS)
// })

// test('[Messenger] Multi-line multi markup test', () => {
//   const actual = parseMarkdown(bigInput, 'messenger')
//   expect(actual).toBe(expectedForBigInputMessenger)
// })

// test('[WhatsApp] Multi-line multi markup test', () => {
//   const actual = parseMarkdown(bigInput, 'whatsapp')
//   expect(actual).toBe(expectedForBigInputWhatsApp)
// })
