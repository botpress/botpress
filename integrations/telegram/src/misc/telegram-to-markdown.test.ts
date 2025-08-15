import { describe, expect, test } from 'vitest'
import { telegramTextMsgToStdMarkdown, type TelegramMark } from './telegram-to-markdown'
import { TestCase } from '../../tests/types'

type TelegramToMarkdownTestCase = TestCase<
  {
    text: string
    marks: TelegramMark[]
  },
  string
> & { expectsWarnings?: string[] }

const telegramToMarkdownTestCases: TelegramToMarkdownTestCase[] = [
  // ==== Testing each mark type ====
  {
    input: {
      text: 'Bold',
      marks: [
        {
          offset: 0,
          length: 4,
          type: 'bold',
        },
      ],
    },
    expects: '**Bold**',
    description: 'Apply bold mark to text',
  },
  {
    input: {
      text: 'Italic',
      marks: [
        {
          offset: 0,
          length: 6,
          type: 'italic',
        },
      ],
    },
    expects: '*Italic*',
    description: 'Apply italic mark to text',
  },
  {
    input: {
      text: 'Strike',
      marks: [
        {
          offset: 0,
          length: 6,
          type: 'strikethrough',
        },
      ],
    },
    expects: '~~Strike~~',
    description: 'Apply strikethrough mark to text',
  },
  {
    input: {
      text: 'Spoiler',
      marks: [
        {
          offset: 0,
          length: 7,
          type: 'spoiler',
        },
      ],
    },
    expects: '||Spoiler||',
    description: 'Apply spoiler mark to text',
  },
  {
    input: {
      text: 'Code Snippet',
      marks: [
        {
          offset: 0,
          length: 12,
          type: 'code',
        },
      ],
    },
    expects: '`Code Snippet`',
    description: 'Apply code mark to text',
  },
  {
    input: {
      text: 'console.log("Code Block")',
      marks: [
        {
          offset: 0,
          length: 25,
          type: 'pre',
        },
      ],
    },
    expects: '```\nconsole.log("Code Block")\n```',
    description: 'Apply code block mark to text - Without language',
  },
  {
    input: {
      text: 'console.log("Code Block")',
      marks: [
        {
          offset: 0,
          length: 25,
          type: 'pre',
          language: 'javascript',
        },
      ],
    },
    expects: '```javascript\nconsole.log("Code Block")\n```',
    description: 'Apply code block mark to text - With language',
  },
  {
    input: {
      text: 'Blockquote',
      marks: [
        {
          offset: 0,
          length: 5,
          type: 'blockquote',
        },
      ],
    },
    expects: '> Blockquote',
    description: 'Apply blockquote mark to text',
  },
  {
    input: {
      text: 'Hyperlink',
      marks: [
        {
          offset: 0,
          length: 9,
          type: 'text_link',
          url: 'https://www.botpress.com/',
        },
      ],
    },
    expects: '[Hyperlink](https://www.botpress.com/)',
    description: 'Apply text link mark to text',
  },
  {
    input: {
      text: '514-123-4567',
      marks: [
        {
          offset: 0,
          length: 12,
          type: 'phone_number',
        },
      ],
    },
    expects: '[514-123-4567](tel:5141234567)',
    description: 'Apply phone number mark to text',
  },
  {
    input: {
      text: 'something@yopmail.com',
      marks: [
        {
          offset: 0,
          length: 21,
          type: 'email',
        },
      ],
    },
    expects: '[something@yopmail.com](mailto:something@yopmail.com)',
    description: 'Apply email mark to text',
  },
  {
    input: {
      text: 'Underline',
      marks: [
        {
          offset: 0,
          length: 9,
          type: 'underline',
        },
      ],
    },
    expects: 'Underline',
    expectsWarnings: ['Unknown mark type: underline'],
    description: 'Do not apply unsupported underline effect',
  },
  // ===== Effect Overlapping Tests =====
  {
    input: {
      text: 'abcdefgh',
      marks: [
        { offset: 0, length: 1, type: 'bold' },
        { offset: 1, length: 1, type: 'strikethrough' },
        { offset: 2, length: 1, type: 'bold' },
        { offset: 3, length: 1, type: 'strikethrough' },
        { offset: 4, length: 1, type: 'bold' },
        { offset: 5, length: 1, type: 'strikethrough' },
        { offset: 6, length: 1, type: 'bold' },
        { offset: 7, length: 1, type: 'strikethrough' },
      ],
    },
    expects: '**a**~~b~~**c**~~d~~**e**~~f~~**g**~~h~~',
    description: 'Contiguous non-overlapping effects should remain separate',
  },
  {
    input: {
      text: 'Hello New World',
      marks: [
        { offset: 0, length: 5, type: 'bold' },
        { offset: 10, length: 5, type: 'strikethrough' },
      ],
    },
    expects: '**Hello** New ~~World~~',
    description: 'Non-overlapping effects with gap should remain separate',
  },
  {
    input: {
      text: 'Hello New World',
      marks: [
        { offset: 0, length: 9, type: 'bold' },
        { offset: 6, length: 9, type: 'italic' },
      ],
    },
    expects: '**Hello *New*** *World*',
    description: 'Overlapping effect segments should be merged',
  },
  {
    input: {
      text: 'Hello T World',
      marks: [
        { offset: 0, length: 7, type: 'bold' },
        { offset: 6, length: 7, type: 'italic' },
      ],
    },
    expects: '**Hello *T*** *World*',
    description: 'Single character overlapping effect should be merged',
  },
  {
    input: {
      text: 'Multiple Effects',
      marks: [
        {
          offset: 0,
          length: 16,
          type: 'bold',
        },
        {
          offset: 0,
          length: 16,
          type: 'strikethrough',
        },
      ],
    },
    expects: '~~**Multiple Effects**~~',
    description: 'Overlapping effects on the same range get combined',
  },
  {
    input: {
      text: 'C',
      marks: [
        {
          offset: 0,
          length: 1,
          type: 'bold',
        },
        {
          offset: 0,
          length: 1,
          type: 'strikethrough',
        },
      ],
    },
    expects: '~~**C**~~',
    description: 'Overlapping effects on a single character get combined',
  },
  {
    input: {
      text: 'Once upon a time',
      marks: [
        {
          offset: 0,
          length: 4,
          type: 'bold',
        },
        {
          offset: 0,
          length: 16,
          type: 'italic',
        },
      ],
    },
    expects: '***Once** upon a time*',
    description: 'Encapsulated effect (start) gets nested',
  },
  {
    input: {
      text: 'Once upon a time',
      marks: [
        {
          offset: 5,
          length: 4,
          type: 'bold',
        },
        {
          offset: 0,
          length: 16,
          type: 'italic',
        },
      ],
    },
    expects: '*Once **upon** a time*',
    description: 'Encapsulated effect (center) gets nested',
  },
  {
    input: {
      text: 'Once upon a time',
      marks: [
        {
          offset: 12,
          length: 4,
          type: 'bold',
        },
        {
          offset: 0,
          length: 16,
          type: 'italic',
        },
      ],
    },
    expects: '*Once upon a **time***',
    description: 'Encapsulated effect (end) gets nested',
  },
  {
    input: {
      text: 'Once upon a time',
      marks: [
        {
          offset: 10,
          length: 1,
          type: 'bold',
        },
        {
          offset: 0,
          length: 16,
          type: 'italic',
        },
      ],
    },
    expects: '*Once upon **a** time*',
    description: 'Encapsulated effect on a single character gets nested',
  },
  // ===== Advanced test cases =====
  {
    input: {
      text: 'Multiple Effects',
      marks: [
        { offset: 0, length: 16, type: 'bold' },
        { offset: 0, length: 16, type: 'strikethrough' },
        { offset: 0, length: 16, type: 'italic' },
        { offset: 0, length: 16, type: 'spoiler' },
      ],
    },
    expects: '||*~~**Multiple Effects**~~*||',
    description: 'Multiple effects on the same range get combined',
  },
  {
    input: {
      text: 'C',
      marks: [
        { offset: 0, length: 1, type: 'bold' },
        { offset: 0, length: 1, type: 'strikethrough' },
        { offset: 0, length: 1, type: 'italic' },
        { offset: 0, length: 1, type: 'spoiler' },
      ],
    },
    expects: '||*~~**C**~~*||',
    description: 'Multiple effects on a single character get combined',
  },
  {
    input: {
      text: 'FizzleWhizzyZigzagDazzleHuzzah',
      marks: [
        { offset: 0, length: 18, type: 'bold' },
        { offset: 6, length: 18, type: 'strikethrough' },
        { offset: 12, length: 12, type: 'italic' },
      ],
    },
    expects: '**Fizzle~~Whizzy*Zigzag*~~**~~*Dazzle*~~Huzzah',
    description: 'Check that partial overlapping types get correctly nested',
  },
  {
    input: {
      text: 'FizzleWhizzyZigzagDazzleHuzzah',
      marks: [
        { offset: 0, length: 24, type: 'spoiler' },
        { offset: 6, length: 18, type: 'bold' },
        { offset: 12, length: 12, type: 'italic' },
        { offset: 18, length: 6, type: 'strikethrough' },
      ],
    },
    expects: '||Fizzle**Whizzy*Zigzag~~Dazzle~~***||Huzzah',
    description: 'Check that progressive overlapping types get correctly nested',
  },
  {
    input: {
      text: 'Spoiler\n\n\n\n\n\nText',
      marks: [
        {
          offset: 0,
          length: 17,
          type: 'spoiler',
        },
      ],
    },
    expects: '||Spoiler\n\n\n\n\n\nText||',
    description: 'Apply mark effect to multiline text',
  },
  {
    input: {
      text: 'Hello\nNothing\nMore Quotes!',
      marks: [
        {
          offset: 0,
          length: 5,
          type: 'blockquote',
        },
        {
          offset: 14,
          length: 12,
          type: 'blockquote',
        },
      ],
    },
    expects: '> Hello\nNothing\n> More Quotes!',
    description: 'Apply blockquote markdown to multiple lines, with non-quote line in between',
  },
  {
    input: {
      text: 'Hello Quote World',
      marks: [
        {
          offset: 0,
          length: 17,
          type: 'blockquote',
        },
        {
          offset: 6,
          length: 5,
          type: 'spoiler',
        },
      ],
    },
    expects: '> Hello ||Quote|| World',
    description:
      // An incorrect outcome of this test case would be "> Hello ||> Quote||>  World"
      "Ensure any effect nested within blockquote mark doesn't create multiple blockquote marks (It should only ever be at the start of a line)",
  },
  {
    input: {
      text: 'Quote Line 1\nQuote Line 2\nQuote Line 3',
      marks: [
        {
          offset: 0,
          length: 38,
          type: 'blockquote',
        },
      ],
    },
    expects: '> Quote Line 1\n> Quote Line 2\n> Quote Line 3',
    description: 'Multiline blockquote produces a blockquote mark for each line',
  },
  {
    input: {
      text: 'Quote Line 1\nQuote Line 2\nQuote Line 3',
      marks: [
        {
          offset: 0,
          length: 38,
          type: 'blockquote',
        },
        {
          offset: 13,
          length: 12,
          type: 'bold',
        },
      ],
    },
    expects: '> Quote Line 1\n> **Quote Line 2**\n> Quote Line 3',
    description: 'Multiline blockquote produces a blockquote mark for each line, with intersecting effect',
  },
  {
    input: {
      text: 'Quote Line 1\n\n\n\nQuote Line 2',
      marks: [
        {
          offset: 0,
          length: 28,
          type: 'blockquote',
        },
      ],
    },
    expects: '> Quote Line 1\n> \n> \n> \n> Quote Line 2',
    description: 'Multiline blockquote produces a blockquote mark for each line, with empty lines',
  },
  {
    input: {
      text: 'Quote Line 1\n\n\n\nQuote Line 2',
      marks: [
        {
          offset: 0,
          length: 28,
          type: 'blockquote',
        },
        {
          offset: 0,
          length: 28,
          type: 'bold',
        },
      ],
    },
    expects: '> **Quote Line 1\n> \n> \n> \n> Quote Line 2**',
    description:
      'Multiline blockquote produces a blockquote mark for each line, with empty lines and intersecting effect',
  },
  {
    input: {
      text: 'Hello Many Effects World',
      marks: [
        {
          offset: 6,
          length: 12,
          type: 'bold',
        },
        {
          offset: 6,
          length: 12,
          type: 'italic',
        },
        {
          offset: 6,
          length: 12,
          type: 'strikethrough',
        },
      ],
    },
    expects: 'Hello ~~***Many Effects***~~ World',
    description: "Apply multiple effects to phrase 'Many Effects'",
  },
  {
    input: {
      text: 'Some Link',
      marks: [
        {
          offset: 0,
          length: 9,
          type: 'text_link',
          url: 'https://botpress.com/',
        },
        {
          offset: 5,
          length: 4,
          type: 'bold',
        },
      ],
    },
    expects: '[Some **Link**](https://botpress.com/)',
    description: 'Apply markdown effects to specific words in hyperlink text',
  },
  {
    input: {
      text: 'Some Nested Marks',
      marks: [
        {
          offset: 0,
          length: 17,
          type: 'spoiler',
        },
        {
          offset: 0,
          length: 5,
          type: 'italic',
        },
        {
          offset: 5,
          length: 6,
          type: 'bold',
        },
      ],
    },
    expects: '||*Some* **Nested** Marks||',
    description: 'Nested effects maintain their start/end positions in post-process',
  },
  {
    input: {
      text: 'Some Nested Marks',
      marks: [
        {
          offset: 0,
          length: 5,
          type: 'italic',
        },
        {
          offset: 0,
          length: 9,
          type: 'spoiler',
        },
        {
          offset: 5,
          length: 6,
          type: 'bold',
        },
      ],
    },
    expects: '||*Some* **Nest**||**ed** Marks',
    description: 'Ensure no overlapping when a longer mark partially nests/cuts off a smaller mark',
  },
  {
    input: {
      text: 'Hello Many Effects World',
      marks: [
        {
          offset: 6,
          length: 12,
          type: 'bold',
        },
        {
          offset: 8,
          length: 10,
          type: 'italic',
        },
      ],
    },
    expects: 'Hello **Ma*ny Effects*** World',
    description: 'Apply effect encapsulated within another effect',
  },
]

const _alphabetically = (a: string, b: string) => a.localeCompare(b)

describe('Telegram to Markdown Conversion', () => {
  test.each(telegramToMarkdownTestCases)(
    '$description',
    ({ input, expects, expectsWarnings }: TelegramToMarkdownTestCase) => {
      const { text, warnings = [] } = telegramTextMsgToStdMarkdown(input.text, input.marks)

      if (expectsWarnings && expectsWarnings.length > 0) {
        expect(warnings.sort(_alphabetically)).toEqual(expectsWarnings.sort(_alphabetically))
      }

      expect(text).toBe(expects)
    }
  )
})
