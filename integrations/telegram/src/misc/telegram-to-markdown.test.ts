import { describe, expect, test } from 'vitest'
import { applyMarksToText, MarkEffect, MarkSegment, splitAnyOverlaps } from './telegram-to-markdown'

export type TypedRange = {
  /** Inclusive */
  start: number
  /** Exclusive */
  end: number
  type: string[]
}

/** Creates a range with one or more types associated
 *
 * @param {number} start - Inclusive Index
 * @param {number} end - Exclusive Index
 * @param {string | string[]} type */
function TypedRange(start: number, end: number, type: string | string[]): TypedRange {
  return {
    start,
    end,
    type: Array.isArray(type) ? type : [type],
  }
}

const splitRangeTestCases: [TypedRange[], TypedRange[], string][] = [
  [
    [TypedRange(0, 6, 'bold'), TypedRange(6, 8, 'italic')],
    [TypedRange(0, 6, 'bold'), TypedRange(6, 8, 'italic')],
    'Contiguous but no overlap',
  ],
  [
    [TypedRange(0, 5, 'bold'), TypedRange(7, 8, 'italic')],
    [TypedRange(0, 5, 'bold'), TypedRange(7, 8, 'italic')],
    'No overlap with gap',
  ],
  [
    [TypedRange(0, 6, 'bold'), TypedRange(3, 8, 'italic')],
    [TypedRange(0, 3, 'bold'), TypedRange(3, 6, ['bold', 'italic']), TypedRange(6, 8, 'italic')],
    'Overlap',
  ],
  [
    [TypedRange(0, 6, 'bold'), TypedRange(5, 8, 'italic')],
    [TypedRange(0, 5, 'bold'), TypedRange(5, 6, ['bold', 'italic']), TypedRange(6, 8, 'italic')],
    'Overlap on boundary',
  ],
  [[TypedRange(0, 5, 'bold'), TypedRange(0, 5, 'italic')], [TypedRange(0, 5, ['bold', 'italic'])], 'Identical ranges'],
  [
    [TypedRange(1, 2, 'bold'), TypedRange(1, 2, 'italic')],
    [TypedRange(1, 2, ['bold', 'italic'])],
    'Identical ranges on single character',
  ],
  [
    [TypedRange(0, 1, 'bold'), TypedRange(0, 8, 'italic')],
    [TypedRange(0, 1, ['bold', 'italic']), TypedRange(1, 8, 'italic')],
    'Single character encapsulated range',
  ],
  [
    [TypedRange(6, 18, 'bold'), TypedRange(8, 20, 'italic'), TypedRange(6, 18, 'underline')],
    [
      TypedRange(6, 8, ['bold', 'underline']),
      TypedRange(8, 18, ['bold', 'italic', 'underline']),
      TypedRange(18, 20, 'italic'),
    ],
    'Multiple ranges',
  ],
  [
    // This version of the "Multiple ranges" test adds the "TypedRange(0, 24, [])" to create segments without effects
    [TypedRange(6, 18, 'bold'), TypedRange(8, 20, 'italic'), TypedRange(6, 18, 'underline'), TypedRange(0, 24, [])],
    [
      TypedRange(0, 6, []),
      TypedRange(6, 8, ['bold', 'underline']),
      TypedRange(8, 18, ['bold', 'italic', 'underline']),
      TypedRange(18, 20, 'italic'),
      TypedRange(20, 24, []),
    ],
    'Multiple ranges V2',
  ],
  [
    [TypedRange(8, 15, 'bold'), TypedRange(8, 18, 'italic')],
    [TypedRange(8, 15, ['bold', 'italic']), TypedRange(15, 18, 'italic')],
    'Encapsulated range - Start',
  ],
  [
    [TypedRange(6, 18, 'bold'), TypedRange(8, 14, 'italic')],
    [TypedRange(6, 8, 'bold'), TypedRange(8, 14, ['bold', 'italic']), TypedRange(14, 18, 'bold')],
    'Encapsulated range - Center',
  ],
  [
    [TypedRange(6, 18, 'bold'), TypedRange(12, 18, 'italic')],
    [TypedRange(6, 12, 'bold'), TypedRange(12, 18, ['bold', 'italic'])],
    'Encapsulated range - End',
  ],
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
describe.each(splitRangeTestCases)(
  'Split the range overlaps test cases while maintaining types',
  (rangesToSplit: TypedRange[], expects: TypedRange[], description: string) => {
    test(description, () => {
      const splitRanges = splitAnyOverlaps(rangesToSplit.map(convertRangeToMark))
      expect(splitRanges.map(convertMarkToRange)).toEqual(expects)
    })
  }
)

interface Mark {
  type: string
  offset: number
  length: number
  url?: string
  language?: string
}

type TestCase = {
  input: string
  marks: Mark[]
  expects: string
  description: string
}

describe.each([
  {
    input: 'Hello World',
    marks: [
      {
        offset: 6,
        length: 5,
        type: 'italic',
      },
    ],
    expects: 'Hello __World__',
    description: "Should apply italic mark to the word 'World'",
  },
  {
    input: 'Hello World',
    marks: [
      {
        offset: 0,
        length: 11,
        type: 'text_link',
        url: 'https://www.botpress.com/',
      },
    ],
    expects: '[Hello World](https://www.botpress.com/)',
    description: 'Should apply link mark to the whole text',
  },
  {
    input: 'Strike',
    marks: [
      {
        offset: 0,
        length: 6,
        type: 'strikethrough',
      },
    ],
    expects: '~~Strike~~',
    description: 'Should apply strikethrough mark to the whole text',
  },
  {
    input: 'Hello World',
    marks: [
      {
        offset: 6,
        length: 5,
        type: 'bold',
      },
    ],
    expects: 'Hello **World**',
    description: "Should apply bold mark to the word 'World'",
  },
  {
    input: 'this is ||not spoiler||',
    marks: [
      {
        offset: 0,
        length: 21,
        type: 'code',
      },
    ],
    expects: '`this is ||not spoiler`||',
    description: 'Should apply code mark to the whole text',
  },
  {
    input: 'Spoiler ||Bold Spoiler|| __Italic__',
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
    expects: '||Spoiler|| **||Bold Spoiler||** ||__Italic__||',
    description: 'Apply Spoiler, then bold, then spoiler (ignoring 2nd spoiler & italic)',
  },
  {
    input: 'console.log("Hello World")',
    marks: [
      {
        offset: 0,
        length: 26,
        type: 'pre',
        language: 'javascript',
      },
    ],
    expects: '```javascript\nconsole.log("Hello World")\n```',
    description: 'Apply code block to the whole text',
  },
  {
    input: 'Spoiler\n\n\n\n\n\nText',
    marks: [
      {
        offset: 0,
        length: 17,
        type: 'spoiler',
      },
    ],
    expects: '||Spoiler\n\n\n\n\n\nText||',
    description: 'Apply Spoiler to the whole multiline text',
  },
  {
    input: '514-123-4567',
    marks: [
      {
        offset: 0,
        length: 12,
        type: 'phone_number',
      },
    ],
    expects: '[514-123-4567](tel:5141234567)',
    description: 'Apply phone number markdown',
  },
  {
    input: 'Hello',
    marks: [
      {
        offset: 0,
        length: 5,
        type: 'blockquote',
      },
    ],
    expects: '> Hello',
    description: 'Apply blockquote markdown',
  },
  {
    input: 'Hello\nNothing\nMore Quotes!',
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
    expects: '> Hello\nNothing\n> More Quotes!',
    description: 'Apply blockquote markdown to multiple lines, with non-quote line in between',
  },
  {
    input: 'something@yopmail.com',
    marks: [
      {
        offset: 0,
        length: 21,
        type: 'email',
      },
    ],
    expects: '[something@yopmail.com](mailto:something@yopmail.com)',
    description: 'Apply email markdown with mailto link',
  },
  {
    input: 'Hello Spoiler',
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
    expects: '> Hello ||Spoiler||',
    description: 'Apply blockquote markdown, with spoiler contained within',
  },
  {
    input: 'Hello Many Effects World',
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
        type: 'underline',
      },
    ],
    expects: 'Hello **__Many Effects__** World',
    description: "Apply multiple effects to phrase 'Many Effects'",
  },
  {
    input: 'Hello Many Effects World',
    marks: [
      {
        offset: 6,
        length: 12,
        type: 'bold',
      },
      {
        offset: 8,
        length: 12,
        type: 'italic',
      },
      {
        offset: 6,
        length: 12,
        type: 'underline',
      },
    ],
    expects: 'Hello **Ma__ny Effects__** World',
    description: "Apply multiple effects to the word 'World'",
  },
] as TestCase[])('Telegram to Markdown Conversion', ({ input, marks, expects, description }) => {
  test(description, () => {
    const consoleWarn = console.warn

    console.warn = (firstArg: unknown, ...args: unknown[]) => {
      if (typeof firstArg === 'string') {
        if (firstArg.startsWith('Unknown mark type:')) {
          throw new Error(firstArg)
        }
      }

      consoleWarn(firstArg, ...args)
    }

    expect(applyMarksToText(input, marks)).toBe(expects)

    console.warn = consoleWarn
  })
})
