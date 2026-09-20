import type { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { createInspector, type Inspector } from './inspection.js'
import type { MemoryValue, NamedMemoryBinding, ObjectPropertyMemory, MemoryProvenance } from './memory.js'
import type { SessionIterationRecord } from './session.js'

export function memoryValueType(value: MemoryValue): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return 'array'
  }

  return typeof value
}

export function previewMemoryValue(value: MemoryValue): string {
  return createInspector()(value, { purpose: 'variable', maxTokens: 60, compact: true })
}

/** Keep the full schema in state; show a bounded, readable description in the model inventory. */
function summarizeMemorySchema(schema: JSONSchema7Definition, fallback: string, maxChars = 360): string {
  const shorten = (text: string, limit: number) => (text.length <= limit ? text : `${text.slice(0, limit - 1)}…`)
  const describe = (definition: JSONSchema7Definition, depth: number): string => {
    if (definition === true) {
      return 'any'
    }

    if (definition === false) {
      return 'never'
    }

    const constraints: string[] = []
    const bounds: [keyof JSONSchema7, string][] = [
      ['minimum', 'min'],
      ['maximum', 'max'],
      ['exclusiveMinimum', 'greater than'],
      ['exclusiveMaximum', 'less than'],
      ['multipleOf', 'multiple of'],
      ['minLength', 'min length'],
      ['maxLength', 'max length'],
      ['minItems', 'min items'],
      ['maxItems', 'max items'],
      ['minProperties', 'min properties'],
      ['maxProperties', 'max properties'],
    ]
    for (const [key, label] of bounds) {
      if (typeof definition[key] === 'number') {
        constraints.push(`${label} ${definition[key]}`)
      }
    }

    if (definition.format) {
      constraints.push(definition.format)
    }

    // Standard formats often emit a long equivalent regex; the format is the useful concise instruction.
    if (definition.pattern && !definition.format) {
      constraints.push(`pattern ${shorten(JSON.stringify(definition.pattern), 80)}`)
    }

    if (definition.uniqueItems) {
      constraints.push('unique items')
    }

    let type = depth === 0 ? fallback : 'unknown'
    if (typeof definition.type === 'string') {
      type = definition.type
    } else if (Array.isArray(definition.type)) {
      type = definition.type.join(' | ')
    }

    if (definition.const !== undefined) {
      type = JSON.stringify(definition.const)
    } else if (definition.enum) {
      type = definition.enum
        .slice(0, 6)
        .map((value) => shorten(JSON.stringify(value), 48))
        .join(' | ')
      if (definition.enum.length > 6) {
        type += ` | … (${definition.enum.length} allowed values)`
      }
    } else if (depth < 3 && (definition.anyOf || definition.oneOf)) {
      const variants = definition.anyOf ?? definition.oneOf ?? []
      type = variants
        .slice(0, 4)
        .map((variant) => describe(variant, depth + 1))
        .join(' | ')
      if (variants.length > 4) {
        type += ' | …'
      }
    } else if (depth < 3 && definition.allOf) {
      type = definition.allOf
        .slice(0, 4)
        .map((variant) => describe(variant, depth + 1))
        .join(' & ')
      if (definition.allOf.length > 4) {
        type += ' & …'
      }
    } else if (depth < 3 && definition.properties) {
      const properties = Object.entries(definition.properties)
      const required = new Set(definition.required ?? [])
      const fields = properties.slice(0, 5).map(([name, property]) => {
        const optional = required.has(name) ? '' : '?'
        return `${name}${optional}: ${describe(property, depth + 1)}`
      })
      if (properties.length > 5) {
        fields.push(`… (${properties.length} fields)`)
      }

      type = `{ ${fields.join(', ')} }`
      if (definition.additionalProperties === false) {
        constraints.push('no extra fields')
      }
    } else if (depth < 3 && definition.items !== undefined) {
      if (Array.isArray(definition.items)) {
        type = `[${definition.items
          .slice(0, 5)
          .map((item) => describe(item, depth + 1))
          .join(', ')}]`
      } else {
        type = `Array<${describe(definition.items, depth + 1)}>`
      }
    }

    if (constraints.length) {
      return `${type} [${constraints.join(', ')}]`
    }

    return type
  }

  return shorten(describe(schema, 0), maxChars)
}

function age(provenance: MemoryProvenance, turn: number, now: number): string {
  if (provenance.timestamp === undefined || provenance.turn === undefined) {
    return 'age unknown'
  }

  const seconds = Math.max(0, Math.floor((now - provenance.timestamp) / 1000))
  let amount = 0
  let unit = ''
  if (seconds >= 86400) {
    amount = Math.floor(seconds / 86400)
    unit = 'day'
  } else if (seconds >= 3600) {
    amount = Math.floor(seconds / 3600)
    unit = 'hour'
  } else if (seconds >= 60) {
    amount = Math.floor(seconds / 60)
    unit = 'minute'
  }

  const elapsed = amount === 0 ? 'just now' : `${amount} ${unit}${amount === 1 ? '' : 's'} ago`
  const turns = Math.max(0, turn - provenance.turn)
  return `${elapsed} (${turns === 0 ? 'this turn' : `${turns} turn${turns === 1 ? '' : 's'} ago`})`
}

export function renderMemory(options: {
  bindings: readonly NamedMemoryBinding[]
  properties: readonly ObjectPropertyMemory[]
  iterations?: readonly SessionIterationRecord[]
  latestResultId?: string
  turn: number
  now?: number
  maxChars?: number
  inspector?: Inspector
}): string {
  const bindings = options.bindings
  const properties = options.properties
  const history = options.iterations ?? []
  const inspector = options.inspector ?? createInspector()
  const now = options.now ?? Date.now()
  const maxChars = Math.max(100, options.maxChars ?? 6000)
  const lines = ['## Memory']

  if (!bindings.length && !properties.length && !history.some((entry) => entry.hasResult)) {
    return `${lines[0]}\nNo stored variables or results yet.`
  }

  lines.push('Available in JavaScript. Previews are abbreviated; historical results are read-only.')
  let omitted = 0
  const append = (line: string) => {
    if (lines.join('\n').length + line.length + 60 > maxChars) {
      omitted++
    } else {
      lines.push(line)
    }
  }

  if (bindings.length) {
    lines.push('', '### Variables')
    const ordered = [...bindings].sort(
      (a, b) =>
        ((b.updated ?? b.assigned).timestamp ?? 0) - ((a.updated ?? a.assigned).timestamp ?? 0) ||
        a.name.localeCompare(b.name)
    )

    for (const binding of ordered) {
      const { name } = binding
      const preview = inspector(binding.value, {
        purpose: 'variable',
        maxTokens: 60,
        compact: true,
        identity: { variable: name },
      })
      const action = binding.updated ? 'updated' : 'set'
      const when = age(binding.updated ?? binding.assigned, options.turn, now)

      append(`- \`${name}\`: ${preview} — ${action} ${when}.`)
    }
  }

  if (properties.length) {
    lines.push('', '### Object properties')

    for (const property of properties) {
      const description = property.description ? ` ${property.description.replace(/\s+/g, ' ').slice(0, 120)}` : ''
      const schemaSummary =
        property.schema === undefined ? property.type : summarizeMemorySchema(property.schema, property.type)
      const name = `${property.object}.${property.property}`
      const preview = inspector(property.value, {
        purpose: 'property',
        maxTokens: 60,
        compact: true,
        identity: { object: property.object, property: property.property },
      })
      const access = property.writable ? 'writable' : 'read-only'
      const when =
        property.provenance.timestamp === undefined
          ? 'age unknown'
          : `updated ${age(property.provenance, options.turn, now)}`

      append(`- \`${name}\`: ${preview} (${schemaSummary}; ${access}) — ${when}.${description}`)
    }
  }

  if (history.some((entry) => entry.hasResult)) {
    lines.push('', '### Results')

    for (const [index, entry] of history.entries()) {
      if (!entry.hasResult) {
        continue
      }

      const path = `\`$iterations[${index}].result\``
      const name = entry.id === options.latestResultId ? `\`$return\` = ${path}` : path
      const type = memoryValueType(entry.result)
      const when = age(entry, options.turn, now)

      append(`- ${name} (${type}) — returned ${when}.`)
    }
  }

  if (omitted) {
    lines.push(
      `\n${omitted} additional memory entr${omitted === 1 ? 'y' : 'ies'} omitted from this overview; retained history has ${history.length} iterations.`
    )
  }

  const rendered = lines.join('\n')
  return rendered.length <= maxChars
    ? rendered
    : `## Memory\n${bindings.length} variables and ${history.length} iterations available; overview omitted.`
}
