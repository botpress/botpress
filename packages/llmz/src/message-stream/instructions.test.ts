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
      "## syntax
      Send a message with ■send= followed by a registered component name and its JSON fields on one line, then the literal body on following lines. Choose a registered component. Props go on the header line as JSON; omit them when none are needed. Props-only components have no body. You may send several messages.

      Run JavaScript with ■run on its own line, then the code. Use at most one run block. Return a result to inspect it in the next response; then close with ■end and stop. Do not append an answer before seeing the result.

      Finish with ■next= followed by an available exit name and its JSON fields on one line. Choose an available exit and include required props as JSON on that same line. This block has no body. Follow it with ■end.

      Write actual names and values, never template labels. JSON uses double-quoted keys and strings; do not nest fields under "props" or "value".

      Never write ■ inside a body or prop. All messages go before code. A response must contain code or a final exit.

      ## components
      ### callout
      description: Highlights important information.
      props: - variant: "info"|"warning"|"danger", required
      - columns: number, optional, default 3
      body: required markdown — The highlighted message.

      ### image
      description: Displays an image.
      props: - src: string, required
      - alt: string, required
      body: none

      ### md
      description: Normal Markdown content.
      props: none
      body: required markdown — The response text.

      ## exits
      ### book_meeting
      description: Transfer to sales.
      props: - reason: string, required
      - email: string, required

      ### listen
      description: Give the turn back to the user.
      props: none

      ## response examples
      ## example
      """
      ■start
      ■send=md
      Example **Markdown** content.
      ■next=listen
      ■end
      """

      ## example
      """
      ■start
      ■send=image {"src":"https://example.com","alt":"Example"}
      ■next=listen
      ■end
      """

      ## example
      """
      ■start
      ■send=callout {"variant":"info"}
      Example **Markdown** content.
      ■next=listen
      ■end
      """"
    `)
    expect(output).toContain('■send= followed by a registered component name')
    expect(output).toContain('■run')
    expect(output).toContain('■next= followed by an available exit name')
    expect(output).toContain('Never write ■ inside a body or prop.')
    expect(output).toContain('Return a result to inspect it in the next response')
    expect(output).toContain('Follow it with ■end.')
  })

  it('requires an exit when code is disabled', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS, includeRun: false })
    expect(output).toContain('Finish with ■next= followed by an available exit name')
    expect(output).not.toContain('■run')
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

    expect(output).toContain(
      '### md\ndescription: Normal Markdown content.\nprops: none\nbody: required markdown — The response text.'
    )
    expect(output).toContain(
      '### image\ndescription: Displays an image.\nprops: - src: string, required\n- alt: string, required\nbody: none'
    )
  })

  it('documents exits and their props', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('## exits')
    expect(output).toContain('### listen\ndescription: Give the turn back to the user.\nprops: none')
    expect(output).toContain(
      '### book_meeting\ndescription: Transfer to sales.\nprops: - reason: string, required\n- email: string, required'
    )
  })

  it('generates one example per syntax pattern, ending with the default exit', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('## response examples')
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
    expect(output).toContain('## example\n"""\n■send=callout {"variant":"warning"}\nThis cannot be undone.\n"""')
    expect(output).toContain(
      '## example\n"""\n■start\n■send=callout {"variant":"warning"}\nThis cannot be undone.\n■next=listen\n■end\n"""'
    )
  })

  it('keeps curated props and bodies paired in complete response examples', () => {
    const output = generateInstructions(
      [
        {
          ...callout,
          generation: {
            examples: [
              { props: { variant: 'warning' }, body: 'This operation permanently deletes your account.' },
              { props: { variant: 'info' }, body: 'Saved.' },
            ],
          },
        },
      ],
      { exits: [listen] }
    )
    const completeExamples = output.split('## response examples')[1]!
    expect(completeExamples).toContain('■send=callout {"variant":"info"}\nSaved.\n■next=listen')
    expect(completeExamples).not.toContain('"warning"')
  })

  it('limits inline examples and respects disabled example generation', () => {
    const component = { ...md, generation: { examples: [1, 2, 3, 4].map((n) => ({ body: `Example ${n}` })) } }
    const output = generateInstructions([component], { maxExamples: 0 })
    expect(output).toContain('Example 3')
    expect(output).not.toContain('Example 4')
    expect(generateInstructions([component], { includeExamples: false })).not.toContain('Example 1')
    expect(generateInstructions([component], { includeSend: false })).not.toContain('■send')
  })

  it('respects maxExamples and includeExamples', () => {
    expect(generateInstructions(COMPONENTS, { exits: EXITS, includeExamples: false })).not.toContain(
      '## response examples'
    )
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
      'Displays a horizontally scrollable collection. Use when presenting multiple comparable options. Do not use for a single item.'
    )
  })

  it('sorts components by priority first', () => {
    const prioritized: NormalizedComponentDefinition = {
      ...image,
      name: 'zz-priority',
      generation: { priority: 10 },
    }
    const output = generateInstructions([md, prioritized])
    expect(output.indexOf('### zz-priority')).toBeLessThan(output.indexOf('### md'))
  })

  it('uses inline props in compact mode', () => {
    const output = generateInstructions(COMPONENTS, { verbosity: 'compact' })
    expect(output).toContain('props: variant:"info"|"warning"|"danger" required; columns:number optional, default 3')
    expect(output).not.toContain('## response examples')
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
    expect(output).toContain('- buttons: {label?:string,value?:string}[], required')
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
