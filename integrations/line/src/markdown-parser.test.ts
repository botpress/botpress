import { test, expect } from 'vitest'
import { parseMarkdown } from './markdown-parser'

const FIXED_SIZE_SPACE_CHAR = '\u2002' // 'En space' yields better results for identation in WhatsApp messages

type Test = Record<string, { input: string; expected: string }>
const stripAllTests: Test = {
  empty: { input: '', expected: '' },
  Text: { input: 'test', expected: 'test\n' },
  Paragraph: { input: 'first Paragraph\n\nSecond Paragraph', expected: 'first Paragraph\nSecond Paragraph\n' },
  Hard_line_break: { input: 'line one  \nline two', expected: 'line one\nline two\n' },
  Title_1: { input: '# H1', expected: 'H1\n' },
  Title_2: { input: '## H2', expected: 'H2\n' },
  Title_3: { input: '### H3', expected: 'H3\n' },
  Ordered_list: { input: '1. orderedListItem1\n2. item2', expected: '1. orderedListItem1\n2. item2\n' },
  Unordered_list: { input: '- unorderedListItem1\n- item2', expected: '- unorderedListItem1\n- item2\n' },
  ThematicBreak: { input: 'horizontal\n\n---\n\nrule', expected: 'horizontal\n---\nrule\n' },
  Image: { input: '![image](https://tinyurl.com/mrv4bmyk)', expected: 'https://tinyurl.com/mrv4bmyk\n' },
  Image_with_fallback: { input: '![test](https://tinyurl.com/mrv4bmyk)', expected: 'https://tinyurl.com/mrv4bmyk\n' },
  Table: { input: '| 1 | 2 |\n| - | - |\n| a | b |', expected: '| 1 | 2 |\n| a | b |\n' },
  Footnote: { input: 'footnote[^1]\n\n[^1]: the footnote', expected: 'footnote[1]\n[1] the footnote\n' },
  Definition: { input: 'term\n: definition', expected: 'term\n: definition\n' },
  Task_list: { input: '- [x] taskListItem1\n- [ ] item2', expected: '☑︎ taskListItem1\n☐ item2\n' },
  Emoji_direct: { input: 'emoji direct 😂', expected: 'emoji direct 😂\n' },
  Link: { input: '[title](https://www.example.com)', expected: 'https://www.example.com\n' },
  Link_only: { input: 'https://www.example.com', expected: 'https://www.example.com\n' },
  Blockquote: { input: '> blockquote', expected: 'Quote: “blockquote”\n' },
  Code: { input: '`code`', expected: 'code\n' },
  Code_snippet: { input: '```\n{\n\ta: null\n}\n```', expected: '{\n\ta: null\n}\n' },
  Strong_with_asterisk: { input: '**bold-asterisk**', expected: 'bold-asterisk\n' },
  Strong_with_underscore: { input: '__bold-underscore__', expected: 'bold-underscore\n' },
  Emphasis_with_asterisk: { input: '*italic-asterisk*', expected: 'italic-asterisk\n' },
  Emphasis_with_underscore: { input: '_italic-underscore_', expected: 'italic-underscore\n' },
  Strong_emphasis: { input: '**_strong-emphasis_**', expected: 'strong-emphasis\n' },
  Strong_delete: { input: '**~strong-delete~**', expected: 'strong-delete\n' },
  Emphasis_delete: { input: '**_emphasis-delete_**', expected: 'emphasis-delete\n' },
  Strong_emphasis_delete: { input: '**_~strong-emphasis-delete~_**', expected: 'strong-emphasis-delete\n' },
  Delete: { input: '~~strikethrough~~', expected: 'strikethrough\n' },
  Link_in_list: {
    input: '- first\n- [title](https://www.example.com)',
    expected: '- first\n- https://www.example.com\n',
  },
  Image_in_list: {
    input: '- first\n- ![image](https://tinyurl.com/mrv4bmyk)',
    expected: '- first\n- https://tinyurl.com/mrv4bmyk\n',
  },
  Strong_in_list: {
    input: '- first\n- **strong_second**',
    expected: '- first\n- strong_second\n',
  },
  Unordered_sub_list: {
    input: '- first\n- second\n\t- sub-first\n\t- sub-second\n- third',
    expected: `- first\n- second\n${FIXED_SIZE_SPACE_CHAR}- sub-first\n${FIXED_SIZE_SPACE_CHAR}- sub-second\n- third\n`,
  },
  Ordered_sub_sub_list: {
    input: '1. root\n\t1. sub-one\n\t\t1. sub-two\n',
    expected: `1. root\n${FIXED_SIZE_SPACE_CHAR}1. sub-one\n${FIXED_SIZE_SPACE_CHAR.repeat(2)}1. sub-two\n`,
  },
  Mixed_sub_lists: {
    input: '- unordered\n\t1. ordered\n\t\t- [ ] task',
    expected: `- unordered\n${FIXED_SIZE_SPACE_CHAR}1. ordered\n${FIXED_SIZE_SPACE_CHAR.repeat(2)}☐ task\n`,
  },
  Complicated_lists: {
    input: '- unordered\n\t1. ordered\n- unordered\n\t1. ordered\n\t\t- [ ] task\n- unordered\n',
    expected: `- unordered\n${FIXED_SIZE_SPACE_CHAR}1. ordered\n- unordered\n${FIXED_SIZE_SPACE_CHAR}1. ordered\n${FIXED_SIZE_SPACE_CHAR.repeat(2)}☐ task\n- unordered\n`,
  },
  Emphasize_in_table: {
    input: '| 1 | 2 |\n| - | - |\n| a | _b_ |',
    expected: '| 1 | 2 |\n| a | b |\n',
  },
  Image_in_table: {
    input: '| 1 | 2 |\n| - | - |\n| a | ![image](https://tinyurl.com/mrv4bmyk) |',
    expected: '| 1 | 2 |\n| a | https://tinyurl.com/mrv4bmyk |\n',
  },
  Link_in_table: {
    input: '| 1 | 2 |\n| - | - |\n| a | [title](https://www.example.com) |',
    expected: '| 1 | 2 |\n| a | https://www.example.com |\n',
  },
}

test.each(Object.entries(stripAllTests))(
  '[SMS, MMS] Test %s',
  (_testName: string, testValues: { input: string; expected: string }): void => {
    const actual = parseMarkdown(testValues.input)
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

const expectedForBigInput = `H1
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
[1] the footnote
`

test('Multi-line multi markup test', () => {
  const actual = parseMarkdown(bigInput)
  expect(actual).toBe(expectedForBigInput)
})
