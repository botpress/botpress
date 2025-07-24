import { describe, expect, test } from 'vitest'
import {
  applyMarksToText,
  isOverlapping,
  splitAnyOverlaps,
  postProcessNestedEffects,
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

describe.each(overlapTestCases)(
  'Test isOverlapping check accuracy',
  ({ input: [rangeA, rangeB], expects, description }) => {
    test(description, () => {
      expect(isOverlapping(rangeA, rangeB)).toBe(expects)
      expect(isOverlapping(rangeB, rangeA)).toBe(expects)
    })
  }
)

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

const splitRangeTestCases: [TypedRange[], TypedRange[], string][] = [
  [
    [typedRange(0, 6, 'bold'), typedRange(6, 8, 'italic')],
    [typedRange(0, 6, 'bold'), typedRange(6, 8, 'italic')],
    'Contiguous but no overlap',
  ],
  [
    [typedRange(0, 5, 'bold'), typedRange(7, 8, 'italic')],
    [typedRange(0, 5, 'bold'), typedRange(7, 8, 'italic')],
    'No overlap with gap',
  ],
  [
    [typedRange(0, 6, 'bold'), typedRange(3, 8, 'italic')],
    [typedRange(0, 3, 'bold'), typedRange(3, 6, ['bold', 'italic']), typedRange(6, 8, 'italic')],
    'Overlap',
  ],
  [
    [typedRange(0, 6, 'bold'), typedRange(5, 8, 'italic')],
    [typedRange(0, 5, 'bold'), typedRange(5, 6, ['bold', 'italic']), typedRange(6, 8, 'italic')],
    'Overlap on boundary',
  ],
  [[typedRange(0, 5, 'bold'), typedRange(0, 5, 'italic')], [typedRange(0, 5, ['bold', 'italic'])], 'Identical ranges'],
  [
    [typedRange(1, 2, 'bold'), typedRange(1, 2, 'italic')],
    [typedRange(1, 2, ['bold', 'italic'])],
    'Identical ranges on single character',
  ],
  [
    [typedRange(0, 1, 'bold'), typedRange(0, 8, 'italic')],
    [typedRange(0, 1, ['bold', 'italic']), typedRange(1, 8, 'italic')],
    'Single character encapsulated range',
  ],
  [
    [typedRange(6, 18, 'bold'), typedRange(8, 20, 'italic'), typedRange(6, 18, 'underline')],
    [
      typedRange(6, 8, ['bold', 'underline']),
      typedRange(8, 18, ['bold', 'italic', 'underline']),
      typedRange(18, 20, 'italic'),
    ],
    'Multiple ranges',
  ],
  [
    // This version of the "Multiple ranges" test adds the "TypedRange(0, 24, [])" to create segments without effects
    [typedRange(6, 18, 'bold'), typedRange(8, 20, 'italic'), typedRange(6, 18, 'underline'), typedRange(0, 24, [])],
    [
      typedRange(0, 6, []),
      typedRange(6, 8, ['bold', 'underline']),
      typedRange(8, 18, ['bold', 'italic', 'underline']),
      typedRange(18, 20, 'italic'),
      typedRange(20, 24, []),
    ],
    'Multiple ranges V2',
  ],
  [
    [typedRange(8, 15, 'bold'), typedRange(8, 18, 'italic')],
    [typedRange(8, 15, ['bold', 'italic']), typedRange(15, 18, 'italic')],
    'Encapsulated range - Start',
  ],
  [
    [typedRange(6, 18, 'bold'), typedRange(8, 14, 'italic')],
    [typedRange(6, 8, 'bold'), typedRange(8, 14, ['bold', 'italic']), typedRange(14, 18, 'bold')],
    'Encapsulated range - Center',
  ],
  [
    [typedRange(6, 18, 'bold'), typedRange(12, 18, 'italic')],
    [typedRange(6, 12, 'bold'), typedRange(12, 18, ['bold', 'italic'])],
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

type PostProcessTestCase = {
  input: MarkSegment[]
  expects: MarkSegment[]
  description: string
}

const markSegment = (start: number, end: number, types: string[], children?: MarkSegment[]): MarkSegment => {
  const segment: MarkSegment = {
    start,
    end,
    effects: types.map((type) => ({ type })),
  }

  if (children) {
    segment.children = children
  }

  return segment
}

describe.each([
  {
    input: [
      markSegment(0, 1, ['bold']),
      markSegment(1, 2, ['italic']),
      markSegment(2, 3, ['bold']),
      markSegment(3, 4, ['italic']),
      markSegment(4, 5, ['bold']),
      markSegment(5, 6, ['italic']),
      markSegment(6, 7, ['bold']),
      markSegment(7, 8, ['italic']),
    ],
    expects: [
      markSegment(0, 1, ['bold']),
      markSegment(1, 2, ['italic']),
      markSegment(2, 3, ['bold']),
      markSegment(3, 4, ['italic']),
      markSegment(4, 5, ['bold']),
      markSegment(5, 6, ['italic']),
      markSegment(6, 7, ['bold']),
      markSegment(7, 8, ['italic']),
    ],
    description: 'Alternating effects should remain unaffected',
  },
  {
    input: [
      markSegment(0, 6, ['bold']),
      markSegment(6, 18, ['bold', 'italic']),
      markSegment(18, 24, ['bold', 'italic', 'strikethrough']),
      markSegment(24, 30, ['italic', 'strikethrough']),
    ],
    expects: [
      markSegment(0, 24, ['bold'], [markSegment(6, 24, ['italic'], [markSegment(18, 24, ['strikethrough'])])]),
      markSegment(24, 30, ['italic', 'strikethrough']),
    ],
    description: 'Check that partial overlapping types get correctly nested',
  },
  {
    input: [
      markSegment(0, 6, ['bold']),
      markSegment(6, 18, ['bold', 'italic']),
      markSegment(18, 24, ['bold', 'italic', 'strikethrough']),
      markSegment(24, 30, ['bold', 'italic', 'strikethrough', 'underline']),
    ],
    expects: [
      markSegment(
        0,
        30,
        ['bold'],
        [markSegment(6, 30, ['italic'], [markSegment(18, 30, ['strikethrough'], [markSegment(24, 30, ['underline'])])])]
      ),
    ],
    description: 'Check that progressive overlapping types get correctly nested',
  },
])('Post-processing mark segments', ({ input, expects, description }: PostProcessTestCase) => {
  test(description, () => {
    expect(postProcessNestedEffects(input)).toEqual(expects)
  })
})

type TelegramToMarkdownTestCase = TestCase<
  {
    text: string
    marks: TelegramMark[]
  },
  string
>

describe.each([
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
          type: 'underline',
        },
      ],
    },
    expects: 'Hello World',
    description: 'Should ignore unsupported underline effect',
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
] as TelegramToMarkdownTestCase[])('Telegram to Markdown Conversion', ({ input, expects, description }) => {
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

    expect(applyMarksToText(input.text, input.marks)).toBe(expects)

    console.warn = consoleWarn
  })
})
