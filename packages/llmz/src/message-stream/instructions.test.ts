import { describe, expect, it } from 'vitest'
import { generateInstructions } from './instructions.js'
import { sanitizeMessageText } from './sanitize.js'
import type { NormalizedComponentDefinition, NormalizedExitDefinition } from './types.js'

const md: NormalizedComponentDefinition = {
  name: 'md',
  description: 'Normal Markdown content.',
  propsJsonSchema: { type: 'object', properties: {}, additionalProperties: false },
  body: { format: 'markdown', description: 'The response text.', required: true },
}

const image: NormalizedComponentDefinition = {
  name: 'image',
  description: 'Displays an image.',
  propsJsonSchema: {
    type: 'object',
    properties: {
      src: { type: 'string', format: 'uri' },
      alt: { type: 'string' },
    },
    required: ['src', 'alt'],
    additionalProperties: false,
  },
}

const callout: NormalizedComponentDefinition = {
  name: 'callout',
  description: 'Highlights important information.',
  propsJsonSchema: {
    type: 'object',
    properties: {
      variant: { type: 'string', enum: ['info', 'warning', 'danger'] },
      columns: { type: 'number', default: 3 },
    },
    required: ['variant'],
    additionalProperties: false,
  },
  body: { format: 'markdown', description: 'The highlighted message.', required: true },
}

const listen: NormalizedExitDefinition = { name: 'listen', description: 'Give the turn back to the user.' }
const bookMeeting: NormalizedExitDefinition = {
  name: 'book_meeting',
  description: 'Transfer to sales.',
  propsJsonSchema: {
    type: 'object',
    properties: {
      reason: { type: 'string' },
      email: { type: 'string' },
    },
    required: ['reason', 'email'],
  },
}

const COMPONENTS = [md, image, callout]
const EXITS = [listen, bookMeeting]

describe('instruction generator', () => {
  it('is deterministic and independent of input ordering', () => {
    const a = generateInstructions([callout, md, image], { exits: [bookMeeting, listen] })
    const b = generateInstructions([md, image, callout], { exits: [listen, bookMeeting] })
    expect(a).toBe(b)
    expect(generateInstructions(COMPONENTS, { exits: EXITS })).toBe(a)
  })

  it('documents the core syntax', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toMatchInlineSnapshot(`
      "Respond using only ■ blocks, with this exact syntax:

      ■send=<component> {props}
      body content

      ■run
      // TypeScript code to execute

      ■next=<exit> {props}

      \`■send\` sends a message component to the user. Props are a JSON object on the same line as the header; the body is everything after the header line, until the next \`■\`. \`■run\` executes code; the body is the code. Always end your response with \`■next=<exit>\`. Never write \`■\` inside props or body content. Do not output unregistered components or unspecified props.

      Components:

      callout — Highlights important information.
      Props:
      - variant: "info"|"warning"|"danger", required
      - columns: number, optional, default 3
      Body: required markdown — The highlighted message.

      image — Displays an image.
      Props:
      - src: string, required
      - alt: string, required
      Body: none

      md — Normal Markdown content.
      Props: none
      Body: required markdown — The response text.

      Exits:

      book_meeting — Transfer to sales.
      Props:
      - reason: string, required
      - email: string, required

      listen — Give the turn back to the user.
      Props: none

      Examples:

      ■send=md
      Example **Markdown** content.
      ■next=listen

      ■send=image {"src":"https://example.com","alt":"Example"}
      ■next=listen

      ■send=callout {"variant":"info"}
      Example **Markdown** content.
      ■next=listen"
    `)
    expect(output).toContain('■send=<component> {props}')
    expect(output).toContain('■run')
    expect(output).toContain('■next=<exit> {props}')
    expect(output).toContain('Never write `■` inside props or body content.')
    expect(output).toContain('Always end your response with `■next=<exit>`.')
  })

  it('omits run and next when not available', () => {
    const output = generateInstructions(COMPONENTS, { includeRun: false })
    expect(output).not.toContain('■run')
    expect(output).not.toContain('■next')
  })

  it('documents props with explicit optionality, enums and defaults', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('- src: string, required')
    expect(output).toContain('- alt: string, required')
    expect(output).toContain('- variant: "info"|"warning"|"danger", required')
    expect(output).toContain('- columns: number, optional, default 3')
  })

  it('documents body support per component', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('md — Normal Markdown content.\nProps: none\nBody: required markdown — The response text.')
    expect(output).toContain(
      'image — Displays an image.\nProps:\n- src: string, required\n- alt: string, required\nBody: none'
    )
  })

  it('documents exits and their props', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('Exits:')
    expect(output).toContain('listen — Give the turn back to the user.\nProps: none')
    expect(output).toContain(
      'book_meeting — Transfer to sales.\nProps:\n- reason: string, required\n- email: string, required'
    )
  })

  it('generates one example per syntax pattern, ending with the default exit', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('Examples:')
    expect(output).toContain('■send=md\nExample **Markdown** content.\n■next=listen')
    expect(output).toContain('■send=image {"src":"https://example.com","alt":"Example"}\n■next=listen')
    expect(output).toContain('■send=callout {"variant":"info"}\nExample **Markdown** content.\n■next=listen')
  })

  it('prefers user-provided generation examples', () => {
    const withExample: NormalizedComponentDefinition = {
      ...callout,
      generation: { examples: [{ props: { variant: 'warning' }, body: 'This cannot be undone.' }] },
    }
    const output = generateInstructions([withExample], { exits: EXITS })
    expect(output).toContain('■send=callout {"variant":"warning"}\nThis cannot be undone.\n■next=listen')
  })

  it('respects maxExamples and includeExamples', () => {
    expect(generateInstructions(COMPONENTS, { exits: EXITS, includeExamples: false })).not.toContain('Examples:')
    const output = generateInstructions(COMPONENTS, { exits: EXITS, maxExamples: 1 })
    expect(output.split('■send=').length - 2).toBe(1) // one example send + the syntax template
  })

  it('appends usage metadata to the component title', () => {
    const carousel: NormalizedComponentDefinition = {
      name: 'carousel',
      description: 'Displays a horizontally scrollable collection.',
      propsJsonSchema: { type: 'object', properties: {} },
      generation: {
        usage: 'Use when presenting multiple comparable options',
        doNotUseWhen: 'Do not use for a single item',
      },
    }
    const output = generateInstructions([carousel])
    expect(output).toContain(
      'carousel — Displays a horizontally scrollable collection. Use when presenting multiple comparable options. Do not use for a single item.'
    )
  })

  it('sorts components by priority first', () => {
    const prioritized: NormalizedComponentDefinition = {
      ...image,
      name: 'zz-priority',
      generation: { priority: 10 },
    }
    const output = generateInstructions([md, prioritized])
    expect(output.indexOf('zz-priority —')).toBeLessThan(output.indexOf('md —'))
  })

  it('uses inline props in compact mode', () => {
    const output = generateInstructions(COMPONENTS, { verbosity: 'compact' })
    expect(output).toContain('Props: variant:"info"|"warning"|"danger" required; columns:number optional, default 3')
    expect(output).not.toContain('Examples:')
  })

  it('renders nested types compactly', () => {
    const buttons: NormalizedComponentDefinition = {
      name: 'buttons',
      propsJsonSchema: {
        type: 'object',
        properties: {
          buttons: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, value: { type: 'string' } },
            },
          },
        },
        required: ['buttons'],
      },
    }
    const output = generateInstructions([buttons])
    expect(output).toContain('- buttons: {label:string,value:string}[], required')
  })
})

describe('sanitize', () => {
  it('replaces the reserved marker', () => {
    expect(sanitizeMessageText('a ■send=md b ■ c')).toBe('a ▪send=md b ▪ c')
  })

  it('supports a custom replacement', () => {
    expect(sanitizeMessageText('■', { markerReplacement: '[block]' })).toBe('[block]')
  })
})
