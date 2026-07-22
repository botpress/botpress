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

  const sections: string[] = [_coreSyntax({ includeSend, includeRun, hasExits: exits.length > 0 })]

  if (sorted.length) {
    sections.push('Components:\n\n' + sorted.map((c) => _componentEntry(c, verbosity)).join('\n\n'))
  }

  if (exits.length) {
    sections.push('Exits:\n\n' + exits.map((e) => _exitEntry(e, verbosity)).join('\n\n'))
  }

  if (includeExamples) {
    const examples = _buildExamples(sorted, exits, maxExamples)
    if (examples.length) {
      sections.push('Examples:\n\n' + examples.join('\n\n'))
    }
  }

  return sections.join('\n\n')
}

const _coreSyntax = ({
  includeSend,
  includeRun,
  hasExits,
}: {
  includeSend: boolean
  includeRun: boolean
  hasExits: boolean
}): string => {
  const blocks = [
    ...(includeSend ? [`${MARKER}send=<component> {props}\nbody content`] : []),
    ...(includeRun ? [`${MARKER}run\n// TypeScript code to execute`] : []),
    ...(hasExits ? [`${MARKER}next=<exit> {props}`] : []),
  ]

  const rules = [
    ...(includeSend
      ? [
          `\`${MARKER}send\` sends a message component to the user. Props are a JSON object on the same line as the header; the body is everything after the header line, until the next \`${MARKER}\`.`,
        ]
      : []),
    ...(includeRun ? [`\`${MARKER}run\` executes code; the body is the code.`] : []),
    ...(hasExits
      ? [
          `Always end your response with \`${MARKER}next=<exit>\`.`,
          `Props are written inline as a plain JSON object of the fields themselves (e.g. \`${MARKER}next=done {"id": "123"}\`) — never wrap them in a "props" or "value" key.`,
        ]
      : []),
    `Never write \`${MARKER}\` inside props or body content.${includeSend ? ' Do not output unregistered components or unspecified props.' : ''}`,
  ]

  return `Respond using only ${MARKER} blocks, with this exact syntax:\n\n${blocks.join('\n\n')}\n\n${rules.join(' ')}`
}

const _sortComponents = (components: NormalizedComponentDefinition[]): NormalizedComponentDefinition[] =>
  [...components].sort((a, b) => {
    const priority = (b.generation?.priority ?? 0) - (a.generation?.priority ?? 0)
    return priority !== 0 ? priority : a.name.localeCompare(b.name)
  })

const _componentEntry = (definition: NormalizedComponentDefinition, verbosity: InstructionVerbosity): string => {
  const lines: string[] = [_titleLine(definition.name, definition.description, definition.generation)]

  const props = _propEntries(definition.propsJsonSchema)
  if (!props.length) {
    lines.push('Props: none')
  } else if (verbosity === 'compact') {
    lines.push(`Props: ${props.map((p) => _inlineProp(p)).join('; ')}`)
  } else {
    lines.push('Props:')
    lines.push(...props.map((p) => _bulletProp(p, verbosity)))
  }

  if (!definition.body) {
    lines.push('Body: none')
  } else {
    const requirement = definition.body.required ? 'required' : 'optional'
    const description = definition.body.description ? ` — ${_oneLine(definition.body.description)}` : ''
    lines.push(`Body: ${requirement} ${definition.body.format}${description}`)
  }

  return lines.join('\n')
}

const _exitEntry = (exit: NormalizedExitDefinition, verbosity: InstructionVerbosity): string => {
  const lines: string[] = [_titleLine(exit.name, exit.description)]

  const props = exit.propsJsonSchema ? _propEntries(exit.propsJsonSchema) : []
  if (!props.length) {
    lines.push('Props: none')
  } else if (verbosity === 'compact') {
    lines.push(`Props: ${props.map((p) => _inlineProp(p)).join('; ')}`)
  } else {
    lines.push('Props:')
    lines.push(...props.map((p) => _bulletProp(p, verbosity)))
  }

  return lines.join('\n')
}

const _titleLine = (
  name: string,
  description?: string,
  generation?: NormalizedComponentDefinition['generation']
): string => {
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
  return parts.length ? `${name} — ${parts.join(' ')}` : name
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
        .map(([key, value]) => `${key}:${_renderType(value, depth + 1)}`)
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

  const bodyOnly = components.find((c) => c.body && !_propEntries(c.propsJsonSchema).some((p) => p.required))
  const propsOnly = components.find((c) => !c.body && _propEntries(c.propsJsonSchema).length > 0)
  const propsAndBody = components.find((c) => c.body && _propEntries(c.propsJsonSchema).some((p) => p.required))

  const examples: string[] = []

  if (bodyOnly) {
    examples.push(`${MARKER}send=${bodyOnly.name}\n${_exampleBody(bodyOnly)}${suffix}`)
  }
  if (propsOnly) {
    examples.push(`${MARKER}send=${propsOnly.name} ${_exampleProps(propsOnly)}${suffix}`)
  }
  if (propsAndBody) {
    examples.push(
      `${MARKER}send=${propsAndBody.name} ${_exampleProps(propsAndBody)}\n${_exampleBody(propsAndBody)}${suffix}`
    )
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
  const custom = definition.generation?.examples?.[0]?.body
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
