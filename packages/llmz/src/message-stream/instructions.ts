import { MARKER, type JsonSchema, type NormalizedComponentDefinition, type NormalizedExitDefinition } from './types.js'

export type InstructionVerbosity = 'compact' | 'standard' | 'verbose'

export type InstructionGeneratorOptions = {
  /** Exits available to `■next`. */
  exits?: NormalizedExitDefinition[]
  /** Whether the `■run` directive is available. Default: true. */
  includeRun?: boolean
  /** Whether the `■send` directive is available. Default: true when at least one component is registered. */
  includeSend?: boolean
  verbosity?: InstructionVerbosity
  /** Defaults to true, except in compact mode. */
  includeExamples?: boolean
  maxExamples?: number
  /** Sort components by priority then name. Default: true. */
  sortComponents?: boolean
}

/**
 * Converts registered component and exit definitions into a deterministic,
 * model-facing protocol specification. Given the same definitions and options,
 * the output is byte-identical — safe for prompt caching and snapshots.
 */
export function generateInstructions(
  components: NormalizedComponentDefinition[],
  options: InstructionGeneratorOptions = {}
): string {
  const verbosity = options.verbosity ?? 'standard'
  const includeExamples = options.includeExamples ?? verbosity !== 'compact'
  const maxExamples = options.maxExamples ?? 3
  const includeRun = options.includeRun ?? true
  const exits = [...(options.exits ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  const includeSend = options.includeSend ?? components.length > 0

  const sorted = options.sortComponents === false ? [...components] : _sortComponents(components)

  const sections: string[] = [_section('syntax', _coreSyntax({ includeSend, includeRun, hasExits: exits.length > 0 }))]

  if (sorted.length) {
    sections.push(
      _section(
        'components',
        sorted.map((c) => _componentEntry(c, verbosity, includeExamples && includeSend)).join('\n\n')
      )
    )
  }

  if (exits.length) {
    sections.push(_section('exits', exits.map((e) => _exitEntry(e, verbosity)).join('\n\n')))
  }

  if (includeExamples) {
    const examples = _buildExamples(includeSend ? sorted : [], exits, maxExamples)
    if (examples.length) {
      sections.push(_section('response_examples', examples.map((example) => _section('example', example)).join('\n\n')))
    }
  }

  return sections.join('\n\n')
}

const _section = (tag: string, content: string): string => `<${tag}>\n${content}\n</${tag}>`

const _attribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const _coreSyntax = ({
  includeSend,
  includeRun,
  hasExits,
}: {
  includeSend: boolean
  includeRun: boolean
  hasExits: boolean
}): string => {
  const blocks: string[] = []

  if (includeSend) {
    blocks.push(`SEND A MESSAGE
${MARKER}send=<component> {props}
body content

A component is a kind of user-facing message, such as text, an image, or a button. Choose a name from <components>. Its props are named settings; its body is the content after the header line. If its body is "none", do not put any content after the header. Each send block is delivered to the user, so include ONLY content intended for them. You may send several components using separate blocks.`)
  }

  if (includeRun) {
    blocks.push(`EXECUTE CODE
${MARKER}run
// JavaScript code to execute

The program executes this block as JavaScript. Call the available tools here as JavaScript, NOT XML tool-call tags or standalone JSON. Writing about a tool does not call it. The code runs inside an async function, so you can use await and return directly. Use at most ONE run block per response; several tool calls can go inside that block. To inspect a result, return it. The program will give you that result in a NEW message, and you can then generate your next response.`)
  }

  if (hasExits) {
    blocks.push(`FINISH OR HAND OVER CONTROL
${MARKER}next=<exit> {props}

An exit tells the program what happens next. Choose a name from <exits> and supply its required props. This block has NO body. It ends this response; do not write anything after it.`)
  }

  const rules = [
    `START DIRECTLY with ${MARKER}. Do not put a greeting, explanation, reasoning, or Markdown code fence before the first block. Keep internal deliberation out of ALL output blocks.`,
    `Write each block header on its own line, starting with ${MARKER}. A block ends when the next header starts or your response ends. There is NO closing marker: never write a standalone ${MARKER}, an end tag, or a closing code fence to finish a block.`,
    ...(includeSend || hasExits
      ? [
          `In the forms above, angle-bracket names and {props} are placeholders, NOT literal output. Replace the name with an available name, without angle brackets. Write props as a JSON object on the SAME LINE as the header, with double-quoted keys and strings. Include required props; omit the object when no props are needed. Put the fields directly in the object, never inside a "props" or "value" wrapper.`,
        ]
      : []),
    ...(includeRun
      ? [
          `When code returns a result, STOP GENERATING after the code. Do not append ${includeSend ? 'a message, ' : ''}an exit, or an explanation. The program supplies the result automatically; do not ask for it, invent it, or write the next response yet. "Stop" means end your output; do not write the word STOP.`,
        ]
      : []),
    ...(hasExits
      ? [
          includeRun
            ? `End your response with either a \`${MARKER}run\` block to inspect results or \`${MARKER}next=<exit>\` to finish.`
            : `Always end your response with \`${MARKER}next=<exit>\`.`,
        ]
      : []),
    `Never write \`${MARKER}\` inside props or body content.${includeSend ? ' Do not output unregistered components or unspecified props.' : ''}`,
    `The XML tags in these instructions separate documentation sections. DO NOT copy those tags into your response. Examples illustrate the format; substitute the actual facts and inputs for the current task.`,
  ]

  const purpose = includeSend
    ? 'Your response is read by a program that sends messages, executes code, and hands over control. It recognizes the exact block headers described below. Ordinary prose outside these blocks is not a user-facing message or an action.'
    : 'Your response is read by a program that executes code and hands over control. It recognizes the exact block headers described below. Ordinary prose outside these blocks does not perform an action.'

  return `${purpose}\n\nA BLOCK consists of a header line and, when allowed, a body on the following lines. The character ${MARKER} starts every header. These are the available block forms, NOT a sequence to copy in full. Choose only the blocks needed for your next action.\n\n${blocks.join('\n\n')}\n\nFormatting rules:\n${rules.map((rule) => `- ${rule}`).join('\n')}`
}

const _sortComponents = (components: NormalizedComponentDefinition[]): NormalizedComponentDefinition[] =>
  [...components].sort((a, b) => {
    const priority = (b.generation?.priority ?? 0) - (a.generation?.priority ?? 0)
    return priority !== 0 ? priority : a.name.localeCompare(b.name)
  })

const _componentEntry = (
  definition: NormalizedComponentDefinition,
  verbosity: InstructionVerbosity,
  includeExamples: boolean
): string => {
  const description = _description(definition.description, definition.generation)
  const lines: string[] = [`<component name="${_attribute(definition.name)}">`]

  if (description) {
    lines.push(_section('description', description))
  }

  const props = _propEntries(definition.propsJsonSchema)
  if (!props.length) {
    lines.push(_section('props', 'none'))
  } else if (verbosity === 'compact') {
    lines.push(_section('props', props.map((p) => _inlineProp(p)).join('; ')))
  } else {
    lines.push(_section('props', props.map((p) => _bulletProp(p, verbosity)).join('\n')))
  }

  if (!definition.body) {
    lines.push(_section('body', 'none'))
  } else {
    const requirement = definition.body.required ? 'required' : 'optional'
    const description = definition.body.description ? ` — ${_oneLine(definition.body.description)}` : ''
    lines.push(_section('body', `${requirement} ${definition.body.format}${description}`))
  }

  if (verbosity !== 'compact' && includeExamples) {
    for (const example of (definition.generation?.examples ?? []).slice(0, 3)) {
      const props = example.props ? ` ${JSON.stringify(example.props)}` : ''
      const body = definition.body ? (example.body ?? _exampleBody(definition)) : undefined
      lines.push(_section('example', `${MARKER}send=${definition.name}${props}${body ? `\n${body}` : ''}`))
    }
  }

  return [...lines, '</component>'].join('\n')
}

const _exitEntry = (exit: NormalizedExitDefinition, verbosity: InstructionVerbosity): string => {
  const lines: string[] = [`<exit name="${_attribute(exit.name)}">`]

  if (exit.description) {
    lines.push(_section('description', _description(exit.description)))
  }

  const props = exit.propsJsonSchema ? _propEntries(exit.propsJsonSchema) : []
  if (!props.length) {
    lines.push(_section('props', 'none'))
  } else if (verbosity === 'compact') {
    lines.push(_section('props', props.map((p) => _inlineProp(p)).join('; ')))
  } else {
    lines.push(_section('props', props.map((p) => _bulletProp(p, verbosity)).join('\n')))
  }

  return [...lines, '</exit>'].join('\n')
}

const _description = (description?: string, generation?: NormalizedComponentDefinition['generation']): string => {
  const parts: string[] = []
  if (description) {
    parts.push(_sentence(description))
  }
  if (generation?.usage) {
    parts.push(_sentence(generation.usage))
  }
  if (generation?.doNotUseWhen) {
    parts.push(_sentence(generation.doNotUseWhen))
  }
  return parts.join(' ')
}

type PropEntry = {
  name: string
  type: string
  required: boolean
  description?: string
  defaultValue?: unknown
}

const _propEntries = (schema: JsonSchema): PropEntry[] => {
  const properties = schema.properties ?? {}
  const required = new Set(schema.required ?? [])

  return Object.entries(properties).map(([name, propSchema]) => {
    const prop = typeof propSchema === 'object' ? propSchema : ({} as JsonSchema)
    return {
      name,
      type: _renderType(prop),
      required: required.has(name),
      description: prop.description,
      defaultValue: prop.default,
    }
  })
}

const _inlineProp = (prop: PropEntry): string => {
  const requirement = prop.required ? ' required' : ' optional'
  const defaultValue = prop.defaultValue !== undefined ? `, default ${JSON.stringify(prop.defaultValue)}` : ''
  return `${prop.name}:${prop.type}${requirement}${defaultValue}`
}

const _bulletProp = (prop: PropEntry, verbosity: InstructionVerbosity): string => {
  const requirement = prop.required ? 'required' : 'optional'
  const defaultValue = prop.defaultValue !== undefined ? `, default ${JSON.stringify(prop.defaultValue)}` : ''
  const description = prop.description && verbosity !== 'compact' ? ` — ${_oneLine(prop.description)}` : ''
  return `- ${prop.name}: ${prop.type}, ${requirement}${defaultValue}${description}`
}

const _renderType = (schema: JsonSchema | boolean | undefined, depth = 0): string => {
  if (!schema || typeof schema === 'boolean') {
    return 'any'
  }
  if (schema.enum) {
    return schema.enum.map((value) => JSON.stringify(value)).join('|')
  }
  if (schema.const !== undefined) {
    return JSON.stringify(schema.const)
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

  switch (type) {
    case 'string':
      return 'string'
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    case 'array': {
      const items = Array.isArray(schema.items) ? schema.items[0] : schema.items
      return `${_renderType(items, depth + 1)}[]`
    }
    case 'object': {
      if (depth >= 2 || !schema.properties) {
        return 'object'
      }
      const inner = Object.entries(schema.properties)
        .map(([key, value]) => `${key}${schema.required?.includes(key) ? '' : '?'}:${_renderType(value, depth + 1)}`)
        .join(',')
      return `{${inner}}`
    }
    default: {
      const variants = schema.anyOf ?? schema.oneOf
      if (variants?.length) {
        const rendered = variants.map((variant) => _renderType(variant as JsonSchema, depth + 1))
        return [...new Set(rendered)].join('|')
      }
      return 'any'
    }
  }
}

const _buildExamples = (
  components: NormalizedComponentDefinition[],
  exits: NormalizedExitDefinition[],
  maxExamples: number
): string[] => {
  const defaultExit = exits.find((e) => e.name === 'listen') ?? exits[0]
  const suffix = defaultExit ? `\n${_exitExample(defaultExit)}` : ''

  // Prefer components with curated examples over auto-generated filler
  const pick = (predicate: (c: NormalizedComponentDefinition) => boolean | undefined) =>
    components.find((c) => c.generation?.examples?.length && predicate(c)) ?? components.find(predicate)

  const bodyOnly = pick((c) => c.body && !_propEntries(c.propsJsonSchema).some((p) => p.required))
  const propsOnly = pick((c) => !c.body && _propEntries(c.propsJsonSchema).length > 0)
  const propsAndBody = pick((c) => c.body && _propEntries(c.propsJsonSchema).some((p) => p.required))

  const examples: string[] = []

  // Keep each curated props/body pair together when choosing a short example.
  // Mixing the first example's props with another example's body teaches a
  // response the component author never intended.
  const completeExample = (definition: NormalizedComponentDefinition): string => {
    const custom = [...(definition.generation?.examples ?? [])].sort(
      (a, b) => (a.body?.length ?? 0) - (b.body?.length ?? 0)
    )[0]
    const props = custom ? (custom.props ? ` ${JSON.stringify(custom.props)}` : '') : ` ${_exampleProps(definition)}`
    const body = definition.body ? (custom?.body ?? _exampleBody(definition)) : undefined
    return `${MARKER}send=${definition.name}${props === ' {}' ? '' : props}${body ? `\n${body}` : ''}${suffix}`
  }
  if (bodyOnly) {
    examples.push(completeExample(bodyOnly))
  }
  if (propsOnly) {
    examples.push(completeExample(propsOnly))
  }
  if (propsAndBody) {
    examples.push(completeExample(propsAndBody))
  }

  return examples.slice(0, maxExamples)
}

const _exitExample = (exit: NormalizedExitDefinition): string => {
  const props: Record<string, unknown> = {}
  if (exit.propsJsonSchema) {
    const required = new Set(exit.propsJsonSchema.required ?? [])
    for (const [key, propSchema] of Object.entries(exit.propsJsonSchema.properties ?? {})) {
      if (required.has(key) && typeof propSchema === 'object') {
        props[key] = _exampleValue(propSchema, key)
      }
    }
  }
  return `${MARKER}next=${exit.name}${Object.keys(props).length ? ` ${JSON.stringify(props)}` : ''}`
}

const _exampleProps = (definition: NormalizedComponentDefinition): string => {
  const custom = definition.generation?.examples?.[0]?.props
  if (custom) {
    return JSON.stringify(custom)
  }

  const props: Record<string, unknown> = {}
  for (const prop of _propEntries(definition.propsJsonSchema).filter((p) => p.required)) {
    const schema = (definition.propsJsonSchema.properties?.[prop.name] ?? {}) as JsonSchema
    props[prop.name] = _exampleValue(schema, prop.name)
  }
  return JSON.stringify(props)
}

const _exampleValue = (schema: JsonSchema, name: string): unknown => {
  if (schema.default !== undefined) {
    return schema.default
  }
  if (schema.const !== undefined) {
    return schema.const
  }
  if (schema.enum?.length) {
    return schema.enum[0]
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

  switch (type) {
    case 'string':
      return schema.format === 'uri' || /url|src|href/i.test(name) ? 'https://example.com' : 'Example'
    case 'number':
    case 'integer':
      return 1
    case 'boolean':
      return true
    case 'array': {
      const items = Array.isArray(schema.items) ? schema.items[0] : schema.items
      return items && typeof items === 'object' ? [_exampleValue(items, name)] : []
    }
    case 'object': {
      const value: Record<string, unknown> = {}
      const required = new Set(schema.required ?? [])
      for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
        if (required.has(key) && typeof propSchema === 'object') {
          value[key] = _exampleValue(propSchema, key)
        }
      }
      return value
    }
    default:
      return 'Example'
  }
}

const _exampleBody = (definition: NormalizedComponentDefinition): string => {
  const bodies = (definition.generation?.examples ?? []).map((e) => e.body).filter((b): b is string => !!b)
  const custom = bodies[0]
  if (custom) {
    return custom
  }
  switch (definition.body?.format) {
    case 'code':
      return "console.log('example')"
    case 'text':
      return 'Example text content.'
    default:
      return 'Example **Markdown** content.'
  }
}

const _oneLine = (text: string): string => text.replaceAll(/\s+/g, ' ').trim()

const _sentence = (text: string): string => {
  const line = _oneLine(text)
  return /[.!?]$/.test(line) ? line : `${line}.`
}
