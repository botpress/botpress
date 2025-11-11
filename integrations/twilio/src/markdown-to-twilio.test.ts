import { test, expect } from 'vitest'
import { transformMarkdownForTwilio } from './markdown-to-twilio'

const FIXED_SIZE_SPACE_CHAR = '\u2002' // 'En space' yields better results for identation in WhatsApp messages

type Test = Record<string, { input: string; expected: string }>

const messengerTests: Test = {
  Code: { input: '`code`', expected: '`code`\n' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '```\n{\n\ta: null\n}\n```\n' },
  Strong_with_asterisk: { input: '**bold-asterisk**', expected: '*bold-asterisk*\n' },
  Strong_with_underscore: { input: '__bold-underscore__', expected: '*bold-underscore*\n' },
  Emphasis_with_asterisk: { input: '*italic-asterisk*', expected: '_italic-asterisk_\n' },
  Emphasis_with_underscore: { input: '_italic-underscore_', expected: '_italic-underscore_\n' },
  Strong_emphasis: { input: '**_strong-emphasis_**', expected: '*_strong-emphasis_*\n' },
  Strong_delete: { input: '**~strong-delete~**', expected: '*~strong-delete~*\n' },
  Emphasis_delete: { input: '_~emphasis-delete~_', expected: '_~emphasis-delete~_\n' },
  Strong_emphasis_delete: { input: '**_~strong-emphasis-delete~_**', expected: '*_~strong-emphasis-delete~_*\n' },
  Delete: { input: '~~strikethrough~~', expected: '~strikethrough~\n' },
  Strong_in_list: {
    input: '- first\n- **strong_second**',
    expected: '- first\n- *strong_second*\n',
  },
  Emphasize_in_table: {
    input: '| 1 | 2 |\n| - | - |\n| a | _b_ |',
    expected: '| 1 | 2 |\n| a | _b_ |\n',
  },
}

const whatsappTests: Test = {
  ...messengerTests,
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '```{\n\ta: null\n}```\n' },
}

test.each(Object.entries(messengerTests))(
  '[Messenger] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = transformMarkdownForTwilio(testValues.input, 'messenger')
    expect(actual).toBe(testValues.expected)
  }
)

test.each(Object.entries(whatsappTests))(
  '[WhatsApp] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = transformMarkdownForTwilio(testValues.input, 'whatsapp')
    expect(actual).toBe(testValues.expected)
  }
)

const bigInput = `# H1
## H2
### H3
**bold-asterisk**
*italic-asterisk*
<!-- This comment will not appear in rendered output -->
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

const expectedForBigInputMessenger = `H1
H2
H3
*bold-asterisk*
_italic-asterisk_
*bold-underscore*
_italic-underscore_
Quote: “blockquote”
1. orderedListItem1
2. item2
- unorderedListItem1
- item2
\`code\`
horizontal
---
rule
https://www.example.com
https://tinyurl.com/mrv4bmyk
https://tinyurl.com/mrv4bmyk
| 1 | 2 |
| a | b |
\`\`\`
{
  a: null
}
\`\`\`
footnote[1]
term
: definition
~strikethrough~
☑︎ taskListItem1
☐ item2
emoji direct 😂
[1] the footnote
`

const expectedForBigInputWhatsApp = `H1
H2
H3
*bold-asterisk*
_italic-asterisk_
*bold-underscore*
_italic-underscore_
Quote: “blockquote”
1. orderedListItem1
2. item2
- unorderedListItem1
- item2
\`code\`
horizontal
---
rule
https://www.example.com
https://tinyurl.com/mrv4bmyk
https://tinyurl.com/mrv4bmyk
| 1 | 2 |
| a | b |
\`\`\`{
  a: null
}\`\`\`
footnote[1]
term\n: definition
~strikethrough~
☑︎ taskListItem1
☐ item2
emoji direct 😂
[1] the footnote
`

test('[Messenger] Multi-line multi markup test', () => {
  const actual = transformMarkdownForTwilio(bigInput, 'messenger')
  expect(actual).toBe(expectedForBigInputMessenger)
})

test('[WhatsApp] Multi-line multi markup test', () => {
  const actual = transformMarkdownForTwilio(bigInput, 'whatsapp')
  expect(actual).toBe(expectedForBigInputWhatsApp)
})
