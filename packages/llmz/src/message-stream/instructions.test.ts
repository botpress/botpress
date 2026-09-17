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
      "<syntax>
      Your response is read by a program that sends messages, executes code, and hands over control. It recognizes the exact block headers described below. Ordinary prose outside these blocks is not a user-facing message or an action.

      A BLOCK consists of a header line and, when allowed, a body on the following lines. The character ■ starts every header. These are the available block forms, NOT a sequence to copy in full. Choose only the blocks needed for your next action.

      SEND A MESSAGE
      ■send=<component> {props}
      body content

      A component is a kind of user-facing message, such as text, an image, or a button. Choose a name from <components>. Its props are named settings; its body is the content after the header line. If its body is "none", do not put any content after the header. Each send block is delivered to the user, so include ONLY content intended for them. You may send several components using separate blocks.

      EXECUTE CODE
      ■run
      // JavaScript code to execute

      The program executes this block as JavaScript. Call the available tools here as JavaScript, NOT XML tool-call tags or standalone JSON. Writing about a tool does not call it. The code runs inside an async function, so you can use await and return directly. Use at most ONE run block per response; several tool calls can go inside that block. To inspect a result, return it. The program will give you that result in a NEW message, and you can then generate your next response.

      FINISH OR HAND OVER CONTROL
      ■next=<exit> {props}

      An exit tells the program what happens next. Choose a name from <exits> and supply its required props. This block has NO body. It ends this response; do not write anything after it.

      Formatting rules:
      - START DIRECTLY with ■. Do not put a greeting, explanation, reasoning, or Markdown code fence before the first block. Keep internal deliberation out of ALL output blocks.
      - Write each block header on its own line, starting with ■. A block ends when the next header starts or your response ends. There is NO closing marker: never write a standalone ■, an end tag, or a closing code fence to finish a block.
      - In the forms above, angle-bracket names and {props} are placeholders, NOT literal output. Replace the name with an available name, without angle brackets. Write props as a JSON object on the SAME LINE as the header, with double-quoted keys and strings. Include required props; omit the object when no props are needed. Put the fields directly in the object, never inside a "props" or "value" wrapper.
      - When code returns a result, STOP GENERATING after the code. Do not append a message, an exit, or an explanation. The program supplies the result automatically; do not ask for it, invent it, or write the next response yet. "Stop" means end your output; do not write the word STOP.
      - End your response with either a \`■run\` block to inspect results or \`■next=<exit>\` to finish.
      - Never write \`■\` inside props or body content. Do not output unregistered components or unspecified props.
      - The XML tags in these instructions separate documentation sections. DO NOT copy those tags into your response. Examples illustrate the format; substitute the actual facts and inputs for the current task.
      </syntax>

      <components>
      <component name="callout">
      <description>
      Highlights important information.
      </description>
      <props>
      - variant: "info"|"warning"|"danger", required
      - columns: number, optional, default 3
      </props>
      <body>
      required markdown — The highlighted message.
      </body>
      </component>

      <component name="image">
      <description>
      Displays an image.
      </description>
      <props>
      - src: string, required
      - alt: string, required
      </props>
      <body>
      none
      </body>
      </component>

      <component name="md">
      <description>
      Normal Markdown content.
      </description>
      <props>
      none
      </props>
      <body>
      required markdown — The response text.
      </body>
      </component>
      </components>

      <exits>
      <exit name="book_meeting">
      <description>
      Transfer to sales.
      </description>
      <props>
      - reason: string, required
      - email: string, required
      </props>
      </exit>

      <exit name="listen">
      <description>
      Give the turn back to the user.
      </description>
      <props>
      none
      </props>
      </exit>
      </exits>

      <response_examples>
      <example>
      ■send=md
      Example **Markdown** content.
      ■next=listen
      </example>

      <example>
      ■send=image {"src":"https://example.com","alt":"Example"}
      ■next=listen
      </example>

      <example>
      ■send=callout {"variant":"info"}
      Example **Markdown** content.
      ■next=listen
      </example>
      </response_examples>"
    `)
    expect(output).toContain('■send=<component> {props}')
    expect(output).toContain('■run')
    expect(output).toContain('■next=<exit> {props}')
    expect(output).toContain('Never write `■` inside props or body content.')
    expect(output).toContain('End your response with either a `■run` block')
    expect(output).not.toContain('Always end your response with `■next=<exit>`.')
  })

  it('requires an exit when code is disabled', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS, includeRun: false })
    expect(output).toContain('Always end your response with `■next=<exit>`.')
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
      '<component name="md">\n<description>\nNormal Markdown content.\n</description>\n<props>\nnone\n</props>\n<body>\nrequired markdown — The response text.\n</body>\n</component>'
    )
    expect(output).toContain(
      '<component name="image">\n<description>\nDisplays an image.\n</description>\n<props>\n- src: string, required\n- alt: string, required\n</props>\n<body>\nnone\n</body>\n</component>'
    )
  })

  it('documents exits and their props', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('<exits>')
    expect(output).toContain(
      '<exit name="listen">\n<description>\nGive the turn back to the user.\n</description>\n<props>\nnone\n</props>\n</exit>'
    )
    expect(output).toContain(
      '<exit name="book_meeting">\n<description>\nTransfer to sales.\n</description>\n<props>\n- reason: string, required\n- email: string, required\n</props>\n</exit>'
    )
  })

  it('generates one example per syntax pattern, ending with the default exit', () => {
    const output = generateInstructions(COMPONENTS, { exits: EXITS })

    expect(output).toContain('<response_examples>')
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
    const completeExamples = output.split('<response_examples>')[1]!
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
      '<response_examples>'
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
    expect(output.indexOf('<component name="zz-priority">')).toBeLessThan(output.indexOf('<component name="md">'))
  })

  it('uses inline props in compact mode', () => {
    const output = generateInstructions(COMPONENTS, { verbosity: 'compact' })
    expect(output).toContain('<props>\nvariant:"info"|"warning"|"danger" required; columns:number optional, default 3')
    expect(output).not.toContain('<response_examples>')
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
