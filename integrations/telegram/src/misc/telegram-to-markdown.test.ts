import { describe, expect, test } from 'vitest'
import {
  applyMarksToText,
  isOverlapping,
  splitAnyOverlaps,
  type MarkEffect,
  type MarkSegment,
  type Range,
  type TelegramMark,
} from './telegram-to-markdown'

type TestCase<INPUT = unknown, EXPECTED = unknown> = {
  input: INPUT
  expects: EXPECTED
  description: string
}

const range = (start: number, end: number): Range => {
  return { start, end }
}

type OverlapTestCase = TestCase<[Range, Range], boolean>
const overlapTestCases: OverlapTestCase[] = [
  {
    input: [range(0, 6), range(6, 8)],
    expects: false,
    description: 'Contiguous but no overlap',
  },
  {
    input: [range(0, 5), range(6, 8)],
    expects: false,
    description: 'No overlap with 1 character gap',
  },
  {
    input: [range(0, 5), range(7, 8)],
    expects: false,
    description: 'No overlap with gap',
  },
  {
    input: [range(0, 6), range(3, 8)],
    expects: true,
    description: 'Overlap',
  },
  {
    input: [range(0, 6), range(5, 8)],
    expects: true,
    description: 'Overlap on boundary',
  },
  {
    input: [range(0, 5), range(0, 5)],
    expects: true,
    description: 'Identical ranges',
  },
  {
    input: [range(1, 2), range(1, 2)],
    expects: true,
    description: 'Identical ranges on single character',
  },
  {
    input: [range(0, 1), range(0, 8)],
    expects: true,
    description: 'Single character encapsulated range',
  },
  {
    input: [range(8, 15), range(8, 18)],
    expects: true,
    description: 'Encapsulated range - Start',
  },
  {
    input: [range(6, 18), range(8, 14)],
    expects: true,
    description: 'Encapsulated range - Center',
  },
  {
    input: [range(6, 18), range(12, 18)],
    expects: true,
    description: 'Encapsulated range - End',
  },
]

describe('Test isOverlapping check accuracy', () => {
  test.each(overlapTestCases)('$description', ({ input: [rangeA, rangeB], expects }: OverlapTestCase) => {
    expect(isOverlapping(rangeA, rangeB)).toBe(expects)
    expect(isOverlapping(rangeB, rangeA)).toBe(expects)
  })
})

export type TypedRange = Range & {
  type: string[]
}

/** Creates a range with one or more types associated
 *
 * @param {number} start - Inclusive Index
 * @param {number} end - Exclusive Index
 * @param {string | string[]} type */
const typedRange = (start: number, end: number, type: string | string[]): TypedRange => {
  return {
    start,
    end,
    type: Array.isArray(type) ? type : [type],
  }
}

type SplitRangeTestCase = TestCase<TypedRange[], TypedRange[]>
const splitRangeTestCases: SplitRangeTestCase[] = [
  {
    input: [typedRange(0, 6, 'bold'), typedRange(6, 8, 'italic')],
    expects: [typedRange(0, 6, 'bold'), typedRange(6, 8, 'italic')],
    description: 'Contiguous but no overlap',
  },
  {
    input: [typedRange(0, 5, 'bold'), typedRange(7, 8, 'italic')],
    expects: [typedRange(0, 5, 'bold'), typedRange(7, 8, 'italic')],
    description: 'No overlap with gap',
  },
  {
    input: [typedRange(0, 6, 'bold'), typedRange(3, 8, 'italic')],
    expects: [typedRange(0, 3, 'bold'), typedRange(3, 6, ['bold', 'italic']), typedRange(6, 8, 'italic')],
    description: 'Overlap',
  },
  {
    input: [typedRange(0, 6, 'bold'), typedRange(5, 8, 'italic')],
    expects: [typedRange(0, 5, 'bold'), typedRange(5, 6, ['bold', 'italic']), typedRange(6, 8, 'italic')],
    description: 'Overlap on boundary',
  },
  {
    input: [typedRange(0, 5, 'bold'), typedRange(0, 5, 'italic')],
    expects: [typedRange(0, 5, ['bold', 'italic'])],
    description: 'Identical ranges',
  },
  {
    input: [typedRange(1, 2, 'bold'), typedRange(1, 2, 'italic')],
    expects: [typedRange(1, 2, ['bold', 'italic'])],
    description: 'Identical ranges on single character',
  },
  {
    input: [typedRange(0, 1, 'bold'), typedRange(0, 8, 'italic')],
    expects: [typedRange(0, 1, ['bold', 'italic']), typedRange(1, 8, 'italic')],
    description: 'Single character encapsulated range',
  },
  {
    input: [typedRange(6, 18, 'bold'), typedRange(8, 20, 'italic'), typedRange(6, 18, 'underline')],
    expects: [
      typedRange(6, 8, ['bold', 'underline']),
      typedRange(8, 18, ['bold', 'italic', 'underline']),
      typedRange(18, 20, 'italic'),
    ],
    description: 'Multiple ranges',
  },
  {
    input: [
      typedRange(6, 18, 'bold'),
      typedRange(8, 20, 'italic'),
      typedRange(6, 18, 'underline'),
      typedRange(0, 24, []),
    ],
    expects: [
      typedRange(0, 6, []),
      typedRange(6, 8, ['bold', 'underline']),
      typedRange(8, 18, ['bold', 'italic', 'underline']),
      typedRange(18, 20, 'italic'),
      typedRange(20, 24, []),
    ],
    description: 'Multiple ranges V2',
  },
  {
    input: [typedRange(8, 15, 'bold'), typedRange(8, 18, 'italic')],
    expects: [typedRange(8, 15, ['bold', 'italic']), typedRange(15, 18, 'italic')],
    description: 'Encapsulated range - Start',
  },
  {
    input: [typedRange(6, 18, 'bold'), typedRange(8, 14, 'italic')],
    expects: [typedRange(6, 8, 'bold'), typedRange(8, 14, ['bold', 'italic']), typedRange(14, 18, 'bold')],
    description: 'Encapsulated range - Center',
  },
  {
    input: [typedRange(6, 18, 'bold'), typedRange(12, 18, 'italic')],
    expects: [typedRange(6, 12, 'bold'), typedRange(12, 18, ['bold', 'italic'])],
    description: 'Encapsulated range - End',
  },
]

const convertRangeToMark = ({ start, end, type }: TypedRange): MarkSegment => ({
  start,
  end,
  effects: type.map((it) => ({ type: it })),
})
const convertMarkToRange = ({ start, end, effects }: MarkSegment): TypedRange => {
  const type = effects.map((it: MarkEffect): string => it.type)
  type.sort((a: string, b: string) => a.localeCompare(b))

  return {
    start,
    end,
    type,
  }
}
describe('Split the range overlaps test cases while maintaining types', () => {
  test.each(splitRangeTestCases)('$description', ({ input, expects }: SplitRangeTestCase) => {
    const splitRanges = splitAnyOverlaps(input.map(convertRangeToMark))
    expect(splitRanges.map(convertMarkToRange)).toEqual(expects)
  })
})

type TelegramToMarkdownTestCase = TestCase<
  {
    text: string
    marks: TelegramMark[]
  },
  string
>

const telegramToMarkdownTestCases: TelegramToMarkdownTestCase[] = [
  // ==== Testing each mark type ====
  {
    input: {
      text: 'Hello World',
      marks: [
        {
          offset: 6,
          length: 5,
          type: 'bold',
        },
      ],
    },
    expects: 'Hello **World**',
    description: "Should apply bold mark to the word 'World'",
  },
  {
    input: {
      text: 'Hello World',
      marks: [
        {
          offset: 6,
          length: 5,
          type: 'italic',
        },
      ],
    },
    expects: 'Hello *World*',
    description: "Should apply italic mark to the word 'World'",
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
    description: 'Should apply strikethrough mark to the whole text',
  },
  {
    input: {
      text: 'this is ||not spoiler||',
      marks: [
        {
          offset: 0,
          length: 21,
          type: 'code',
        },
      ],
    },
    expects: '`this is ||not spoiler`||',
    description: 'Should apply code mark to the whole text',
  },
  {
    input: {
      text: 'console.log("Hello World")',
      marks: [
        {
          offset: 0,
          length: 26,
          type: 'pre',
          language: 'javascript',
        },
      ],
    },
    expects: '```javascript\nconsole.log("Hello World")\n```',
    description: 'Apply code block to the whole text',
  },
  {
    input: {
      text: 'Hello',
      marks: [
        {
          offset: 0,
          length: 5,
          type: 'blockquote',
        },
      ],
    },
    expects: '> Hello',
    description: 'Apply blockquote markdown',
  },
  {
    input: {
      text: 'Hello World',
      marks: [
        {
          offset: 0,
          length: 11,
          type: 'text_link',
          url: 'https://www.botpress.com/',
        },
      ],
    },
    expects: '[Hello World](https://www.botpress.com/)',
    description: 'Should apply link mark to the whole text',
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
    description: 'Apply phone number markdown',
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
    description: 'Apply email markdown with mailto link',
  },

  {
    input: {
      text: 'Hello World',
      marks: [
        {
          offset: 6,
          length: 5,
          type: 'underline',
        },
      ],
    },
    expects: 'Hello World',
    description: 'Should ignore unsupported underline effect',
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
    description: 'Alternating effects should not intersect/nest',
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
      text: 'Spoiler ||Bold Spoiler|| __Italic__',
      marks: [
        {
          offset: 0,
          length: 7,
          type: 'spoiler',
        },
        {
          offset: 8,
          length: 16,
          type: 'bold',
        },
        {
          offset: 25,
          length: 10,
          type: 'spoiler',
        },
      ],
    },
    expects: '||Spoiler|| **||Bold Spoiler||** ||__Italic__||',
    description: 'Apply Spoiler, then bold, then spoiler (ignoring 2nd spoiler & italic)',
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
    description: 'Apply Spoiler to the whole multiline text',
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
      text: 'Hello Spoiler',
      marks: [
        {
          offset: 0,
          length: 13,
          type: 'blockquote',
        },
        {
          offset: 6,
          length: 7,
          type: 'spoiler',
        },
      ],
    },
    expects: '> Hello ||Spoiler||',
    description: 'Apply blockquote markdown, with spoiler contained within',
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

describe('Telegram to Markdown Conversion', () => {
  test.each(telegramToMarkdownTestCases)('$description', ({ input, expects }: TelegramToMarkdownTestCase) => {
    const consoleWarn = console.warn

    console.warn = (firstArg: unknown, ...args: unknown[]) => {
      if (typeof firstArg === 'string') {
        if (firstArg.startsWith('Unknown mark type:')) {
          throw new Error(firstArg)
        }
      }

      consoleWarn(firstArg, ...args)
    }

    expect(applyMarksToText(input.text, input.marks)).toBe(expects)

    console.warn = consoleWarn
  })
})
