import { quoteExample, quotePartialExample, quoteResponseExample } from '../example-format.js'
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
      sections.push(
        _section(
          'response_examples',
          examples.map((example) => _section('example', quoteResponseExample(example))).join('\n\n')
        )
      )
    }
  }

  return sections.join('\n\n')
}

/** Render catalogues with a partial example beside every component and exit. */
export function generateInstructionSections(
  components: NormalizedComponentDefinition[],
  options: InstructionGeneratorOptions = {}
) {
  const verbosity = options.verbosity ?? 'standard'
  const sorted = options.sortComponents === false ? [...components] : _sortComponents(components)
  const exits = [...(options.exits ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const includeSend = options.includeSend ?? components.length > 0
  const examples = options.includeExamples ?? verbosity !== 'compact'
  return {
    syntax: _coreSyntax({ includeSend, includeRun: options.includeRun ?? true, hasExits: exits.length > 0 }),
    components: sorted
      .map((c) =>
        [_componentEntry(c, verbosity, false), ...(examples && includeSend ? _componentExamples(c, true) : [])].join(
          '\n'
        )
      )
      .join('\n\n'),
    exits: exits
      .map((e) =>
        [_exitEntry(e, verbosity), ...(examples ? ['Example:', quotePartialExample(exitExample(e))] : [])].join('\n')
      )
      .join('\n\n'),
  }
}

const _section = (tag: string, content: string): string =>
  ['props', 'body', 'description'].includes(tag) ? `${tag}: ${content}` : `## ${tag.replaceAll('_', ' ')}\n${content}`

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
    blocks.push(
      `Send a message with ${MARKER}send= followed by a registered component name and its JSON fields on one line, then the literal body on following lines. Choose a registered component. Props go on the header line as JSON; omit them when none are needed. Props-only components have no body. You may send several messages.`
    )
  }
  if (includeRun) {
    blocks.push(
      `Run JavaScript with ${MARKER}run on its own line, then the code. Use at most one run block. Return a result to inspect it in the next response; then close with ${MARKER}end and stop. Do not append an answer before seeing the result.`
    )
  }
  if (hasExits) {
    blocks.push(
      `Finish with ${MARKER}next= followed by an available exit name and its JSON fields on one line. Choose an available exit and include required props as JSON on that same line. This block has no body. Follow it with ${MARKER}end.`
    )
  }
  blocks.push(
    'Write actual names and values, never template labels. JSON uses double-quoted keys and strings; do not nest fields under "props" or "value".',
    `Never write ${MARKER} inside a body or prop. All messages go before code. A response must contain code or a final exit.`
  )
  return blocks.join('\n\n')
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
  const lines: string[] = [`### ${definition.name}`]

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
    lines.push(..._componentExamples(definition))
  }

  return lines.join('\n')
}

const _componentExamples = (definition: NormalizedComponentDefinition, partial = false): string[] => {
  const examples = definition.generation?.examples?.length
    ? definition.generation.examples
    : partial
      ? [{ props: JSON.parse(_exampleProps(definition)), body: _exampleBody(definition) }]
      : []
  return examples
    .filter((example, index) => partial || index < 3 || Array.isArray(example))
    .map((example) => {
      const output = (Array.isArray(example) ? example : [example])
        .map((block) => {
          const props = block.props ? ` ${JSON.stringify(block.props)}` : ''
          const body = definition.body ? (block.body ?? _exampleBody(definition)) : undefined
          return `${MARKER}send=${definition.name}${props === ' {}' ? '' : props}${body ? `\n${body}` : ''}`
        })
        .join('\n')
      return partial ? `Example:\n${quotePartialExample(output)}` : _section('example', quoteExample(output))
    })
}

const _exitEntry = (exit: NormalizedExitDefinition, verbosity: InstructionVerbosity): string => {
  const lines: string[] = [`### ${exit.name}`]

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

  return lines.join('\n')
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
  const suffix = defaultExit ? `\n${exitExample(defaultExit)}` : ''

  // Prefer components with curated examples over auto-generated filler
  const pick = (predicate: (c: NormalizedComponentDefinition) => boolean | undefined) =>
    components.find((c) => c.generation?.examples?.length && predicate(c)) ?? components.find(predicate)

  const bodyOnly = pick((c) => c.body && !_propEntries(c.propsJsonSchema).some((p) => p.required))
  const propsOnly = pick((c) => !c.body && _propEntries(c.propsJsonSchema).length > 0)
  const propsAndBody = pick((c) => c.body && _propEntries(c.propsJsonSchema).some((p) => p.required))

  const examples: string[] = []

  if (bodyOnly) {
    examples.push(componentExample(bodyOnly) + suffix)
  }
  if (propsOnly) {
    examples.push(componentExample(propsOnly) + suffix)
  }
  if (propsAndBody) {
    examples.push(componentExample(propsAndBody) + suffix)
  }

  return examples.slice(0, maxExamples)
}

// Keep each curated props/body pair together when choosing a short example.
// Mixing the first example's props with another example's body teaches a
// response the component author never intended.
export const componentExample = (definition: NormalizedComponentDefinition): string => {
  const custom = (definition.generation?.examples ?? [])
    .flat()
    .sort((a, b) => (a.body?.length ?? 0) - (b.body?.length ?? 0))[0]
  const props = custom ? (custom.props ? ` ${JSON.stringify(custom.props)}` : '') : ` ${_exampleProps(definition)}`
  const body = definition.body ? (custom?.body ?? _exampleBody(definition)) : undefined
  return `${MARKER}send=${definition.name}${props === ' {}' ? '' : props}${body ? `\n${body}` : ''}`
}

export const exitExample = (exit: NormalizedExitDefinition): string => {
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
  const custom = definition.generation?.examples?.flat()[0]?.props
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
  const bodies = (definition.generation?.examples ?? [])
    .flat()
    .map((e) => e.body)
    .filter((b): b is string => !!b)
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
