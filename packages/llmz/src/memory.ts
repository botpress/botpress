import { transforms } from '@bpinternal/zui'
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import type { ObjectInstance } from './objects.js'
import { RESERVED_RUNTIME_NAMES } from './runtime-names.js'
import type { ObjectMutation } from './types.js'
import { getTypings } from './typings.js'

/** Exact, bounded session data. Model-facing previews are never used as stored values. */
export type MemoryValue =
  | null
  | undefined
  | boolean
  | number
  | string
  | MemoryValue[]
  | {
      [key: string]: MemoryValue
    }
export type VariableWrite = {
  name: string
  timestamp: number
  kind?: 'assignment' | 'mutation'
}

export type MemoryProvenance = {
  timestamp?: number
  turn?: number
  turnId?: string
  id?: string
  number?: number
}

export type MemoryChange = {
  name: string
  type: string
  preview: string
  provenance: MemoryProvenance
}

export type IterationMemory = {
  id: string
  number: number
  turn: number
  turnId?: string
  timestamp: number
  outcome: string
  error?: string
  hasResult: boolean
  result?: MemoryValue
  unavailable?: string
}

export type ObjectPropertyMemory = {
  hostValue?: MemoryValue
  object: string
  property: string
  value: MemoryValue
  type: string
  schema?: JSONSchema7Definition
  writable: boolean
  description?: string
  provenance: MemoryProvenance
}
type Binding = {
  value: MemoryValue
  created: MemoryProvenance
  assigned: MemoryProvenance
  updated?: MemoryProvenance
}

type Encoded =
  | ['negative-zero']
  | ['undefined']
  | ['value', null | boolean | number | string]
  | ['array', Encoded[]]
  | ['object', [string, Encoded][]]

export type SerializedMemory = {
  version: 1
  maxBytes: number
  variables: {
    name: string
    value: Encoded
    created: MemoryProvenance
    assigned: MemoryProvenance
    updated?: MemoryProvenance
  }[]
  iterations: (Omit<IterationMemory, 'result'> & {
    value?: Encoded
  })[]
  latestResultId?: string
  objects?: (Omit<ObjectPropertyMemory, 'value' | 'hostValue'> & {
    value: Encoded
    hostValue?: Encoded
  })[]
}

export type MemorySettlement = {
  id: string
  number: number
  turn: number
  turnId?: string
  timestamp?: number
  outcome: string
  error?: string
  variables?: Record<string, unknown>
  variableWrites?: VariableWrite[]
  captureErrors?: {
    name: string
    reason: string
  }[]
  hasResult?: boolean
  result?: unknown
}

export type MemoryReport = {
  created: MemoryChange[]
  updated: MemoryChange[]
  unavailable: {
    name: string
    reason: string
  }[]
  resultAvailable: boolean
}

const RESERVED = RESERVED_RUNTIME_NAMES
const DEFAULT_MAX_BYTES = 16 * 1024 * 1024
function encode(value: unknown, seen = new Set<object>()): Encoded {
  if (value === undefined) {
    return ['undefined']
  }

  if (Object.is(value, -0)) {
    return ['negative-zero']
  }

  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return ['value', value]
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return ['value', value]
  }

  if (typeof value !== 'object') {
    throw new Error(`Unsupported memory value: ${typeof value}`)
  }

  if (seen.has(value)) {
    throw new Error('Cyclic values cannot be retained in memory')
  }

  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    throw new Error('Only plain objects and arrays can be retained in memory')
  }

  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error('Symbol properties cannot be retained in memory')
  }

  seen.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).length !== value.length) {
        throw new Error('Sparse arrays and custom array properties are unsupported')
      }

      const items: Encoded[] = []
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, index)
        if (!descriptor || descriptor.get || descriptor.set) {
          throw new Error('Array accessor properties cannot be retained in memory')
        }

        items.push(encode(descriptor.value, seen))
      }

      return ['array', items]
    }

    const entries: [string, Encoded][] = []
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (descriptor.get || descriptor.set) {
        throw new Error('Accessor properties cannot be retained in memory')
      }

      if (!descriptor.enumerable) {
        throw new Error('Non-enumerable properties cannot be retained in memory')
      }

      entries.push([key, encode(descriptor.value, seen)])
    }

    return ['object', entries]
  } finally {
    seen.delete(value)
  }
}

export function decodeMemoryValue(value: Encoded): MemoryValue {
  if (!Array.isArray(value)) {
    throw new Error('Invalid serialized memory value')
  }

  switch (value[0]) {
    case 'negative-zero':
      return -0
    case 'undefined':
      return undefined
    case 'value': {
      const primitive = value[1]
      if (
        primitive === null ||
        typeof primitive === 'string' ||
        typeof primitive === 'boolean' ||
        (typeof primitive === 'number' && Number.isFinite(primitive))
      ) {
        return primitive
      }

      throw new Error('Invalid serialized primitive')
    }
    case 'array':
      return value[1].map(decodeMemoryValue)
    case 'object':
      return Object.fromEntries(value[1].map(([key, item]) => [key, decodeMemoryValue(item)]))
    default:
      throw new Error('Unknown serialized memory value')
  }
}

export const cloneMemoryValue = (value: unknown): MemoryValue => decodeMemoryValue(encode(value))
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      freeze(child)
    }

    Object.freeze(value)
  }

  return value
}

function typeOf(value: MemoryValue): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return 'array'
  }

  return typeof value
}

export function previewMemoryValue(value: MemoryValue, maxChars = 160): string {
  const describe = (item: MemoryValue, depth: number): string => {
    if (item === undefined) {
      return 'undefined'
    }

    if (typeof item === 'string') {
      return JSON.stringify(item.length > 100 ? `${item.slice(0, 99)}…` : item)
    }

    if (item === null || typeof item !== 'object') {
      return String(item)
    }

    if (Array.isArray(item)) {
      const first = item[0]
      const shape =
        first && typeof first === 'object' && !Array.isArray(first)
          ? ` with ${Object.keys(first)
              .slice(0, 6)
              .map((key) => `\`${key}\``)
              .join(', ')}`
          : ''
      return `${item.length} item${item.length === 1 ? '' : 's'}${shape}`
    }

    if (depth > 0) {
      return '{ … }'
    }

    const entries = Object.entries(item)
    return `{ ${entries
      .slice(0, 4)
      .map(([key, child]) => `${key}: ${describe(child, depth + 1)}`)
      .join(', ')}${entries.length > 4 ? ', …' : ''} }`
  }
  const text = describe(value, 0)
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 1))}…`
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

function propertyMemorySchema(type: Parameters<typeof getTypings>[0]): JSONSchema7Definition {
  let schema: JSONSchema7Definition
  try {
    schema = transforms.toJSONSchema(type) as JSONSchema7Definition
  } catch {
    schema = transforms.toJSONSchemaLegacy(type) as JSONSchema7Definition
  }

  return cloneMemoryValue(schema) as JSONSchema7Definition
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

export class MemoryCapacityError extends Error {
  public constructor(maxBytes: number) {
    super(`Memory limit exceeded (${maxBytes} bytes). Compact retained iterations before continuing.`)
    this.name = 'MemoryCapacityError'
  }
}

export class Memory {
  private _bindings = new Map<string, Binding>()
  private _history: IterationMemory[] = []
  private _objectProperties = new Map<string, ObjectPropertyMemory>()
  private _activeObjects = new Set<string>()
  private _latestResultId?: string
  public readonly maxBytes: number
  public constructor(
    options: {
      variables?: Record<string, unknown>
      maxBytes?: number
    } = {}
  ) {
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
    if (!Number.isFinite(this.maxBytes) || this.maxBytes < 1) {
      throw new Error('Memory maxBytes must be positive')
    }

    for (const [name, value] of Object.entries(options.variables ?? {})) {
      this._assertName(name)
      this._bindings.set(name, {
        value: cloneMemoryValue(value),
        created: {},
        assigned: {},
      })
    }

    this._assertBudget()
  }

  private _assertName(name: string): void {
    if (RESERVED.has(name)) {
      throw new Error(`${name} is reserved for runtime memory`)
    }

    if (!/^[A-Za-z_$][\w$]*$/.test(name) || name.startsWith('__')) {
      throw new Error(`Invalid memory variable: ${name}`)
    }
  }

  /** Object values remain authoritative in the host; this inventory never injects mutable duplicates. */
  public async syncObjects(
    objects: readonly Pick<ObjectInstance, 'name' | 'properties'>[],
    observation: MemoryProvenance = {}
  ): Promise<void> {
    const roots = new Set<string>()
    const next = new Map<string, ObjectPropertyMemory>()
    for (const object of objects) {
      this._assertName(object.name)
      if (roots.has(object.name)) {
        throw new Error(`Duplicate object namespace: ${object.name}`)
      }

      if (this._bindings.has(object.name)) {
        throw new Error(`Object namespace ${object.name} conflicts with a named memory variable`)
      }

      roots.add(object.name)
      for (const property of object.properties ?? []) {
        const path = `${object.name}.${property.name}`
        if (next.has(path)) {
          throw new Error(`Duplicate object property: ${path}`)
        }

        const hostValue = cloneMemoryValue(property.value)
        const previous = this._objectProperties.get(path)
        const previousHostValue =
          previous && Object.prototype.hasOwnProperty.call(previous, 'hostValue') ? previous.hostValue : previous?.value
        const changed = previous && JSON.stringify(encode(previousHostValue)) !== JSON.stringify(encode(hostValue))
        const value = previous && !changed ? previous.value : hostValue
        const type = property.type
          ? (await getTypings(property.type as Parameters<typeof getTypings>[0], {})).trim().replace(/\s+/g, ' ')
          : typeOf(value)
        const schema = property.type
          ? propertyMemorySchema(property.type as Parameters<typeof getTypings>[0])
          : undefined
        const schemaDescription = schema && typeof schema === 'object' ? schema.description : undefined
        next.set(path, {
          object: object.name,
          property: property.name,
          hostValue,
          value,
          type,
          schema,
          writable: property.writable === true,
          description: property.description ?? schemaDescription,
          provenance: changed
            ? {
                ...observation,
              }
            : {
                ...(previous?.provenance ?? {}),
              },
        })
      }
    }

    const previous = this._objectProperties
    this._objectProperties = next
    try {
      this._assertBudget()
    } catch (error) {
      this._objectProperties = previous
      throw error
    }

    this._activeObjects = roots
  }

  public getObjectPropertyValue(object: string, property: string): MemoryValue {
    const path = `${object}.${property}`
    const entry = this._objectProperties.get(path)
    if (!entry || !this._activeObjects.has(object)) {
      throw new Error(`Unknown object property: ${path}`)
    }

    return cloneMemoryValue(entry.value)
  }

  /** Reserve enough metadata for a failure before generation or side effects start. */
  public assertCapacityForIteration(
    info: Partial<Pick<IterationMemory, 'id' | 'number' | 'turn' | 'turnId' | 'timestamp'>> = {}
  ): void {
    const reservation: IterationMemory = {
      id: info.id ?? 'pending_iteration_00000000000000000000000000',
      number: info.number ?? Number.MAX_SAFE_INTEGER,
      turn: info.turn ?? Number.MAX_SAFE_INTEGER,
      turnId: info.turnId ?? 'pending_turn_00000000000000000000000000',
      timestamp: info.timestamp ?? Date.now(),
      outcome: 'thinking_requested',
      error: 'x'.repeat(2000),
      hasResult: false,
      unavailable: 'Result unavailable; see the execution report.',
    }
    this._history.unshift(reservation)
    try {
      this._assertBudget()
    } catch {
      throw new MemoryCapacityError(this.maxBytes)
    } finally {
      this._history.shift()
    }
  }

  /** Reject collisions before executing code, even if the conflicting declaration would run later. */
  public assertNamesAvailable(names: Iterable<string>): void {
    for (const name of names) {
      this._assertName(name)
      if (this._activeObjects.has(name)) {
        throw new Error(`Variable ${name} conflicts with an object namespace`)
      }
    }
  }

  public recordObjectMutations(mutations: readonly ObjectMutation[], provenance: MemoryProvenance): MemoryChange[] {
    const changes = new Map<string, MemoryChange>()
    for (const mutation of mutations) {
      const path = `${mutation.object}.${mutation.property}`
      const previous = this._objectProperties.get(path)
      if (!previous || !this._activeObjects.has(mutation.object)) {
        throw new Error(`Unknown object property: ${path}`)
      }

      if (!previous.writable) {
        throw new Error(`Object property ${path} is read-only`)
      }

      const value = cloneMemoryValue(mutation.after)
      this._objectProperties.set(path, {
        ...previous,
        value,
        provenance: {
          ...provenance,
        },
      })
      try {
        this._assertBudget()
      } catch (error) {
        this._objectProperties.set(path, previous)
        throw error
      }

      changes.set(path, {
        name: path,
        type: previous.type,
        preview: previewMemoryValue(value),
        provenance: {
          ...provenance,
        },
      })
    }

    return [...changes.values()]
  }

  public get variables(): Record<string, MemoryValue> {
    return Object.fromEntries([...this._bindings].map(([name, binding]) => [name, cloneMemoryValue(binding.value)]))
  }

  public get iterations(): readonly IterationMemory[] {
    return freeze(cloneMemoryValue(this._history) as IterationMemory[])
  }
  public getBindings(): Record<string, MemoryValue> {
    const history = freeze(cloneMemoryValue(this._history) as IterationMemory[])
    const latest = history.find((entry) => entry.id === this._latestResultId)
    const bindings: Record<string, MemoryValue> = this.variables
    Object.defineProperties(bindings, {
      $return: {
        value: latest?.result,
        enumerable: true,
        writable: false,
        configurable: false,
      },
      $iterations: {
        value: history,
        enumerable: true,
        writable: false,
        configurable: false,
      },
    })
    return bindings
  }

  public commit(input: MemorySettlement): MemoryReport {
    if (this._history.some((entry) => entry.id === input.id)) {
      throw new Error(`Iteration ${input.id} was already settled`)
    }

    const timestamp = input.timestamp ?? Date.now()
    const entry: IterationMemory = {
      id: input.id,
      number: input.number,
      turn: input.turn,
      turnId: input.turnId,
      timestamp,
      outcome: input.outcome,
      ...(input.error
        ? {
            error: input.error.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 2000),
          }
        : {}),
      hasResult: false,
      unavailable: 'Result unavailable; see the execution report.',
    }
    this._history.unshift(entry)
    try {
      this._assertBudget()
    } catch {
      this._history.shift()
      throw new MemoryCapacityError(this.maxBytes)
    }

    const report = this.assign(input.variables ?? {}, input)
    if (input.hasResult) {
      try {
        const captureFailure = input.captureErrors?.find((item) => item.name === '$return')
        if (captureFailure) {
          throw new Error(captureFailure.reason)
        }

        entry.result = cloneMemoryValue(input.result)
        entry.hasResult = true
        this._latestResultId = entry.id
        this._assertBudget()
        delete entry.unavailable
        report.resultAvailable = true
      } catch (err) {
        delete entry.result
        entry.hasResult = false
        if (!report.unavailable.some((item) => item.name === '$return')) {
          report.unavailable.push({
            name: '$return',
            reason: err instanceof Error ? err.message : String(err),
          })
        }
      }

      // A successful but unavailable result must not leave an older value posing as the latest.
      this._latestResultId = entry.hasResult ? entry.id : undefined
    } else {
      delete entry.unavailable
    }

    return report
  }

  /** Finalize a terminal decision after memory is settled and its delivery/exit hooks finish. */
  public updateOutcome(id: string, outcome: string, error?: string): void {
    const entry = this._history.find((iteration) => iteration.id === id)
    if (!entry) {
      throw new Error(`Cannot update unsettled iteration ${id}`)
    }

    const previous = { ...entry }
    entry.outcome = outcome
    if (error) {
      entry.error = error.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 2000)
    } else {
      delete entry.error
    }

    try {
      this._assertBudget()
    } catch (failure) {
      Object.assign(entry, previous)
      if (!Object.hasOwn(previous, 'error')) {
        delete entry.error
      }

      throw failure
    }
  }

  public assign(
    variables: Record<string, unknown>,
    metadata: Omit<MemorySettlement, 'variables' | 'hasResult' | 'result' | 'outcome'> & {
      outcome?: string
    }
  ): MemoryReport {
    const input = {
      ...metadata,
      variables,
    }
    const timestamp = input.timestamp ?? Date.now()
    const provenance: MemoryProvenance = {
      timestamp,
      turn: input.turn,
      turnId: input.turnId,
      id: input.id,
      number: input.number,
    }
    const report: MemoryReport = {
      created: [],
      updated: [],
      unavailable: [...(input.captureErrors ?? [])],
      resultAvailable: false,
    }
    const writes = new Map(input.variableWrites?.map((write) => [write.name, write]))
    const assignments = new Map(
      input.variableWrites?.filter((write) => write.kind !== 'mutation').map((write) => [write.name, write])
    )

    for (const { name } of input.captureErrors ?? []) {
      this._bindings.delete(name)
    }

    for (const [name, raw] of Object.entries(input.variables ?? {})) {
      if (
        RESERVED.has(name) ||
        name.startsWith('__') ||
        input.captureErrors?.some((failure) => failure.name === name)
      ) {
        continue
      }

      const previous = this._bindings.get(name)

      try {
        this._assertName(name)
        this.assertNamesAvailable([name])

        const value = cloneMemoryValue(raw)
        const write = writes.get(name)
        const changed = !previous || JSON.stringify(encode(previous.value)) !== JSON.stringify(encode(value))

        if (!changed && !write) {
          continue
        }

        const assigned = {
          ...provenance,
          timestamp: write?.timestamp ?? timestamp,
        }
        const mutation = !!previous && (!write || write.kind === 'mutation')
        const assignment = assignments.get(name)
        let assignmentProvenance: MemoryProvenance = assigned

        if (assignment) {
          assignmentProvenance = {
            ...provenance,
            timestamp: assignment.timestamp,
          }
        } else if (mutation) {
          assignmentProvenance = previous.assigned
        }

        this._bindings.set(name, {
          value,
          created: previous?.created ?? assignmentProvenance,
          assigned: assignmentProvenance,
          updated: mutation ? assigned : undefined,
        })

        try {
          this._assertBudget()
        } catch (err) {
          this._bindings.delete(name)
          throw err
        }

        const changes = previous ? report.updated : report.created
        changes.push({
          name,
          type: typeOf(value),
          preview: previewMemoryValue(value),
          provenance: assigned,
        })
      } catch (err) {
        this._bindings.delete(name)
        report.unavailable.push({
          name,
          reason: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return report
  }

  public compact(retainedIds: Iterable<string>): void {
    const retained = new Set(retainedIds)
    this._history = this._history.filter((entry) => retained.has(entry.id))

    if (this._latestResultId && !retained.has(this._latestResultId)) {
      this._latestResultId = undefined
    }
  }

  public render(options: { turn: number; now?: number; maxChars?: number }): string {
    const now = options.now ?? Date.now()
    const maxChars = Math.max(100, options.maxChars ?? 6000)
    const lines = ['## Memory']

    if (!this._bindings.size && !this._activeObjects.size && !this._history.some((entry) => entry.hasResult)) {
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

    if (this._bindings.size) {
      lines.push('', '### Variables')
      const ordered = [...this._bindings].sort(
        ([a, x], [b, y]) =>
          ((y.updated ?? y.assigned).timestamp ?? 0) - ((x.updated ?? x.assigned).timestamp ?? 0) || a.localeCompare(b)
      )

      for (const [name, binding] of ordered) {
        const preview = previewMemoryValue(binding.value)
        const action = binding.updated ? 'updated' : 'set'
        const when = age(binding.updated ?? binding.assigned, options.turn, now)

        append(`- \`${name}\`: ${preview} — ${action} ${when}.`)
      }
    }

    const properties = [...this._objectProperties.values()].filter((property) =>
      this._activeObjects.has(property.object)
    )

    if (properties.length) {
      lines.push('', '### Object properties')

      for (const property of properties) {
        const description = property.description ? ` ${property.description.replace(/\s+/g, ' ').slice(0, 120)}` : ''
        const schemaSummary =
          property.schema === undefined ? property.type : summarizeMemorySchema(property.schema, property.type)
        const name = `${property.object}.${property.property}`
        const preview = previewMemoryValue(property.value)
        const access = property.writable ? 'writable' : 'read-only'
        const when =
          property.provenance.timestamp === undefined
            ? 'age unknown'
            : `updated ${age(property.provenance, options.turn, now)}`

        append(`- \`${name}\`: ${preview} (${schemaSummary}; ${access}) — ${when}.${description}`)
      }
    }

    if (this._history.some((entry) => entry.hasResult)) {
      lines.push('', '### Results')

      for (const [index, entry] of this._history.entries()) {
        if (!entry.hasResult) {
          continue
        }

        const path = `\`$iterations[${index}].result\``
        const name = entry.id === this._latestResultId ? `\`$return\` (also ${path})` : path
        const preview = previewMemoryValue(entry.result)
        const when = age(entry, options.turn, now)

        append(`- ${name}: ${preview} — returned ${when}.`)
      }
    }

    if (omitted) {
      lines.push(
        `\n${omitted} additional memory entr${omitted === 1 ? 'y' : 'ies'} omitted from this overview; retained history has ${this._history.length} iterations.`
      )
    }

    const rendered = lines.join('\n')
    return rendered.length <= maxChars
      ? rendered
      : `## Memory\n${this._bindings.size} variables and ${this._history.length} iterations available; overview omitted.`
  }

  public serialize(): SerializedMemory {
    return {
      version: 1,
      maxBytes: this.maxBytes,
      variables: [...this._bindings].map(([name, binding]) => ({
        name,
        ...binding,
        value: encode(binding.value),
        created: {
          ...binding.created,
        },
        assigned: {
          ...binding.assigned,
        },
        updated: binding.updated
          ? {
              ...binding.updated,
            }
          : undefined,
      })),
      iterations: this._history.map(({ result, ...entry }) => ({
        ...entry,
        ...(entry.hasResult
          ? {
              value: encode(result),
            }
          : {}),
      })),
      latestResultId: this._latestResultId,
      objects: [...this._objectProperties.values()].map((property) => ({
        ...property,
        value: encode(property.value),
        hostValue: encode(property.hostValue),
        schema: cloneMemoryValue(property.schema) as JSONSchema7Definition | undefined,
        provenance: {
          ...property.provenance,
        },
      })),
    }
  }

  public toJSON(): SerializedMemory {
    return this.serialize()
  }

  public static fromJSON(state: SerializedMemory): Memory {
    return Memory.restore(state)
  }

  public static restore(state: SerializedMemory): Memory {
    if (state.version !== 1) {
      throw new Error('Unsupported memory version')
    }

    const memory = new Memory({
      maxBytes: state.maxBytes,
    })
    for (const binding of state.variables) {
      memory._assertName(binding.name)
      if (memory._bindings.has(binding.name)) {
        throw new Error('Duplicate persisted memory binding')
      }

      memory._bindings.set(binding.name, {
        value: decodeMemoryValue(binding.value),
        created: {
          ...binding.created,
        },
        assigned: {
          ...binding.assigned,
        },
        updated: binding.updated
          ? {
              ...binding.updated,
            }
          : undefined,
      })
    }

    for (const property of state.objects ?? []) {
      memory._assertName(property.object)
      memory._objectProperties.set(`${property.object}.${property.property}`, {
        ...property,
        value: decodeMemoryValue(property.value),
        hostValue: property.hostValue ? decodeMemoryValue(property.hostValue) : decodeMemoryValue(property.value),
        schema: cloneMemoryValue(property.schema) as JSONSchema7Definition | undefined,
        provenance: {
          ...property.provenance,
        },
      })
    }

    const ids = new Set<string>()
    memory._history = state.iterations.map(({ value, ...entry }) => {
      if (ids.has(entry.id)) {
        throw new Error('Duplicate persisted memory iteration')
      }

      ids.add(entry.id)
      if (entry.hasResult && !value) {
        throw new Error(`Missing result payload for iteration ${entry.id}`)
      }

      return {
        ...entry,
        ...(entry.hasResult
          ? {
              result: decodeMemoryValue(value!),
            }
          : {}),
      }
    })
    memory._latestResultId = state.latestResultId
    if (
      state.latestResultId &&
      !memory._history.some((entry) => entry.id === state.latestResultId && entry.hasResult)
    ) {
      throw new Error('Missing latest memory result')
    }

    memory._assertBudget()
    return memory
  }

  private _assertBudget(): void {
    // UTF-8 encoded persistence size also bounds the materialized VM view.
    if (new TextEncoder().encode(JSON.stringify(this.serialize())).byteLength > this.maxBytes) {
      throw new MemoryCapacityError(this.maxBytes)
    }
  }
}
