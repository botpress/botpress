import { test, expect } from 'vitest'
import { markdownToMessenger, markdownToTwilio, markdownToWhatsApp } from './markdown-to-twilio'

const mdGenericTests = {
  Title_1: { input: '# H1', expected: 'H1' },
  Title_2: { input: '## H2', expected: 'H2' },
  Title_3: { input: '### H3', expected: 'H3' },
  Ordered_list: { input: '1. orderedListItem1\n2. item2', expected: '1. orderedListItem1\n2. item2' },
  Unordered_list: { input: '- unorderedListItem1\n- item2', expected: '- unorderedListItem1\n- item2' },
  Horizontal_rule: { input: 'horizontal\n\n---\n\nrule', expected: 'horizontal\n---\nrule' },
  Image: { input: '![image](https://tinyurl.com/mrv4bmyk)', expected: 'https://tinyurl.com/mrv4bmyk' },
  Table: { input: '| 1 | 2 |\n| - | - |\n| a | b |', expected: '| 1 | 2 |\n| - | - |\n| a | b |' },
  Footnote: { input: 'footnote[^1]\n\n[^1]: the footnote', expected: 'footnote[^1]\n[^1]: the footnote' },
  Definition: { input: 'term\n: definition', expected: 'term\n: definition' },
  Task_list: { input: '- [x] taskListItem1\n- [ ] item2', expected: '- [x] taskListItem1\n- [ ] item2' },
  Emoji_direct: { input: 'emoji direct 😂', expected: 'emoji direct 😂' },
  // Highlight: { input: '==Highlight==', expected: 'Highlight' }, // chatGPT does not seem to send these
  Subscript: { input: 'H~2~O', expected: 'H2O' },
  Superscript: { input: 'X^2^', expected: 'X2' },
}

const smsSpecificTests = {
  Blockquote: { input: '> blockquote', expected: 'blockquote' },
  Code: { input: '`code`', expected: 'code' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '{\n\ta: null\n}' },
  Bold_with_asterisk: { input: '**bold-asterisk**', expected: 'bold-asterisk' },
  Bold_with_underscore: { input: '__bold-underscore__', expected: 'bold-underscore' },
  Italic_with_asterisk: { input: '*italic-asterisk*', expected: 'italic-asterisk' },
  Italic_with_underscore: { input: '_italic-underscore_', expected: 'italic-underscore' },
  Strikethrough: { input: '~~strikethrough~~', expected: 'strikethrough' },
  Link: { input: '[title](https://www.example.com)', expected: '[title](https://www.example.com)' },
}
const smsTests = { ...mdGenericTests, ...smsSpecificTests }

const messengerSpecificTests = {
  Blockquote: { input: '> blockquote', expected: 'blockquote' },
  Code: { input: '`code`', expected: '`code`' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '```\n{\n\ta: null\n}\n```' },
  Bold_with_asterisk: { input: '**bold-asterisk**', expected: '*bold-asterisk*' },
  Bold_with_underscore: { input: '__bold-underscore__', expected: '*bold-underscore*' },
  Italic_with_asterisk: { input: '*italic-asterisk*', expected: '_italic-asterisk_' },
  Italic_with_underscore: { input: '_italic-underscore_', expected: '_italic-underscore_' },
  Strikethrough: { input: '~~strikethrough~~', expected: '~strikethrough~' },
  Link: { input: '[title](https://www.example.com)', expected: 'https://www.example.com' },
}
const messengerTests = { ...mdGenericTests, ...messengerSpecificTests }

const whatsappSpecificTests = {
  Blockquote: { input: '> blockquote', expected: '> blockquote' },
  Code: { input: '`code`', expected: '`code`' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '```{\n\ta: null\n}```' },
  Bold_with_asterisk: { input: '**bold-asterisk**', expected: '*bold-asterisk*' },
  Bold_with_underscore: { input: '__bold-underscore__', expected: '*bold-underscore*' },
  Italic_with_asterisk: { input: '*italic-asterisk*', expected: '_italic-asterisk_' },
  Italic_with_underscore: { input: '_italic-underscore_', expected: '_italic-underscore_' },
  Strikethrough: { input: '~~strikethrough~~', expected: '~strikethrough~' },
  Link: { input: '[title](https://www.example.com)', expected: 'https://www.example.com' },
}
const whatsappTests = { ...mdGenericTests, ...whatsappSpecificTests }

test.each(Object.entries(smsTests))(
  '[SMS, MMS, RCS] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = markdownToTwilio(testValues.input)
    expect(actual).toBe(testValues.expected)
  }
)

test.each(Object.entries(messengerTests))(
  '[Messenger] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = markdownToMessenger(testValues.input)
    expect(actual).toBe(testValues.expected)
  }
)

test.each(Object.entries(whatsappTests))(
  '[WhatsApp] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = markdownToWhatsApp(testValues.input)
    expect(actual).toBe(testValues.expected)
  }
)

const bigInput = `# H1
## H2
### H3
**bold-asterisk**
*italic-asterisk*
__bold-underscore__
_italic-underscore_
> blockquote
1. orderedListItem1\n2. item2
- unorderedListItem1\n- item2
\`code\`
horizontal\n\n---\n\nrule
[title](https://www.example.com)
![image](https://tinyurl.com/mrv4bmyk)
| 1 | 2 |\n| - | - |\n| a | b |
\`\`\`\n{\n\ta: null\n}\n\`\`\`
footnote[^1]\n\n[^1]: the footnote
term\n: definition
~~strikethrough~~
- [x] taskListItem1\n- [ ] item2
emoji direct 😂
H~2~0
X^2^`

const expectedForBigInputSMS = `H1
H2
H3
bold-asterisk
italic-asterisk
bold-underscore
italic-underscore
blockquote
1. orderedListItem1\n2. item2
- unorderedListItem1\n- item2
code
horizontal\n---\nrule
[title](https://www.example.com)
https://tinyurl.com/mrv4bmyk
| 1 | 2 |\n| - | - |\n| a | b |
{\n\ta: null\n}
footnote[^1]\n[^1]: the footnote
term\n: definition
strikethrough
- [x] taskListItem1\n- [ ] item2
emoji direct 😂
H20
X2`

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
| 1 | 2 |\n| - | - |\n| a | b |
\`\`\`\n{\n\ta: null\n}\n\`\`\`
footnote[^1]\n[^1]: the footnote
term\n: definition
~strikethrough~
- [x] taskListItem1\n- [ ] item2
emoji direct 😂
H20
X2`

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
| 1 | 2 |\n| - | - |\n| a | b |
\`\`\`{\n\ta: null\n}\`\`\`
footnote[^1]\n[^1]: the footnote
term\n: definition
~strikethrough~
- [x] taskListItem1\n- [ ] item2
emoji direct 😂
H20
X2`

test('[SMS, MMS, RCS] Multi-line multi markup test', () => {
  const actual = markdownToTwilio(bigInput)
  expect(actual).toBe(expectedForBigInputSMS)
})

test('[Messenger] Multi-line multi markup test', () => {
  const actual = markdownToMessenger(bigInput)
  expect(actual).toBe(expectedForBigInputMessenger)
})

test('[WhatsApp] Multi-line multi markup test', () => {
  const actual = markdownToWhatsApp(bigInput)
  expect(actual).toBe(expectedForBigInputWhatsApp)
})
