import { transforms } from '@bpinternal/zui'
import type { JSONSchema7Definition } from 'json-schema'
import { AssignmentError, InvalidConfigurationError, MemoryCapacityError, ReservedIdentifierError } from '../errors.js'
import type { Inspector } from '../inspection.js'
import type { ObjectInstance } from '../objects.js'
import { RESERVED_RUNTIME_NAMES } from '../runtime-names.js'
import type { ObjectMutation } from '../types.js'
import { getTypings } from '../typings.js'
import {
  cloneMemoryValue,
  decodeMemoryValue,
  encodeMemoryValue,
  type EncodedMemoryValue,
  type MemoryValue,
} from './memory-codec.js'
import { memoryValueType, previewMemoryValue, renderMemory } from './memory-render.js'

export { MemoryCapacityError } from '../errors.js'

export { cloneMemoryValue, decodeMemoryValue, type MemoryValue } from './memory-codec.js'
export { previewMemoryValue } from './memory-render.js'

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
export type MemoryBinding = {
  value: MemoryValue
  created: MemoryProvenance
  assigned: MemoryProvenance
  updated?: MemoryProvenance
}

export type NamedMemoryBinding = MemoryBinding & { name: string }

export type SerializedMemory = {
  version: 2
  maxBytes: number
  variables: {
    name: string
    value: EncodedMemoryValue
    created: MemoryProvenance
    assigned: MemoryProvenance
    updated?: MemoryProvenance
  }[]
  objects?: (Omit<ObjectPropertyMemory, 'value' | 'hostValue'> & {
    value: EncodedMemoryValue
    hostValue?: EncodedMemoryValue
  })[]
}

export type MemoryAssignment = MemoryProvenance & {
  variableWrites?: VariableWrite[]
  captureErrors?: { name: string; reason: string }[]
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
function propertyMemorySchema(type: Parameters<typeof getTypings>[0]): JSONSchema7Definition {
  let schema: JSONSchema7Definition
  try {
    schema = transforms.toJSONSchema(type) as JSONSchema7Definition
  } catch {
    schema = transforms.toJSONSchemaLegacy(type) as JSONSchema7Definition
  }

  return cloneMemoryValue(schema) as JSONSchema7Definition
}

export class Memory {
  private _bindings = new Map<string, MemoryBinding>()
  private _objectProperties = new Map<string, ObjectPropertyMemory>()
  private _activeObjects = new Set<string>()
  private readonly _additionalBytes: () => number
  public readonly maxBytes: number
  public constructor(
    options: {
      variables?: Record<string, unknown>
      maxBytes?: number
      /** Bytes retained by the owning Session, outside named/object memory. */
      additionalBytes?: () => number
    } = {}
  ) {
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
    this._additionalBytes = options.additionalBytes ?? (() => 0)
    if (!Number.isFinite(this.maxBytes) || this.maxBytes < 1) {
      throw new InvalidConfigurationError('Memory maxBytes must be positive')
    }

    for (const [name, value] of Object.entries(options.variables ?? {})) {
      this._assertName(name)
      this._bindings.set(name, {
        value: cloneMemoryValue(value),
        created: {},
        assigned: {},
      })
    }

    this.assertCapacity()
  }

  private _assertName(name: string): void {
    if (RESERVED.has(name)) {
      throw new ReservedIdentifierError(name, 'variable', false, `${name} is reserved for runtime memory`)
    }

    if (!/^[A-Za-z_$][\w$]*$/.test(name) || name.startsWith('__')) {
      throw new InvalidConfigurationError(`Invalid memory variable: ${name}`)
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
        throw new InvalidConfigurationError(`Duplicate object namespace: ${object.name}`)
      }

      if (this._bindings.has(object.name)) {
        throw new InvalidConfigurationError(`Object namespace ${object.name} conflicts with a named memory variable`)
      }

      roots.add(object.name)
      for (const property of object.properties ?? []) {
        const path = `${object.name}.${property.name}`
        if (next.has(path)) {
          throw new InvalidConfigurationError(`Duplicate object property: ${path}`)
        }

        const hostValue = cloneMemoryValue(property.value)
        const previous = this._objectProperties.get(path)
        const previousHostValue =
          previous && Object.prototype.hasOwnProperty.call(previous, 'hostValue') ? previous.hostValue : previous?.value
        const changed =
          previous &&
          JSON.stringify(encodeMemoryValue(previousHostValue)) !== JSON.stringify(encodeMemoryValue(hostValue))
        const value = previous && !changed ? previous.value : hostValue
        const type = property.type
          ? (await getTypings(property.type as Parameters<typeof getTypings>[0], {})).trim().replace(/\s+/g, ' ')
          : memoryValueType(value)
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
      this.assertCapacity()
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
      throw new InvalidConfigurationError(`Unknown object property: ${path}`)
    }

    return cloneMemoryValue(entry.value)
  }

  /** Reject collisions before executing code, even if the conflicting declaration would run later. */
  public assertNamesAvailable(names: Iterable<string>): void {
    for (const name of names) {
      this._assertName(name)
      if (this._activeObjects.has(name)) {
        throw new AssignmentError(`Variable ${name} conflicts with an object namespace`)
      }
    }
  }

  public recordObjectMutations(mutations: readonly ObjectMutation[], provenance: MemoryProvenance): MemoryChange[] {
    const changes = new Map<string, MemoryChange>()
    for (const mutation of mutations) {
      const path = `${mutation.object}.${mutation.property}`
      const previous = this._objectProperties.get(path)
      if (!previous || !this._activeObjects.has(mutation.object)) {
        throw new InvalidConfigurationError(`Unknown object property: ${path}`)
      }

      if (!previous.writable) {
        throw new InvalidConfigurationError(`Object property ${path} is read-only`)
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
        this.assertCapacity()
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

  public get bindings(): readonly NamedMemoryBinding[] {
    return [...this._bindings].map(([name, binding]) => ({
      name,
      ...binding,
      value: cloneMemoryValue(binding.value),
      created: { ...binding.created },
      assigned: { ...binding.assigned },
      updated: binding.updated ? { ...binding.updated } : undefined,
    }))
  }

  public get objectProperties(): readonly ObjectPropertyMemory[] {
    return [...this._objectProperties.values()]
      .filter((property) => this._activeObjects.has(property.object))
      .map((property) => cloneMemoryValue(property) as ObjectPropertyMemory)
  }

  public assign(variables: Record<string, unknown>, metadata: MemoryAssignment): MemoryReport {
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
        const changed =
          !previous || JSON.stringify(encodeMemoryValue(previous.value)) !== JSON.stringify(encodeMemoryValue(value))

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
          this.assertCapacity()
        } catch (err) {
          this._bindings.delete(name)
          throw err
        }

        const changes = previous ? report.updated : report.created
        changes.push({
          name,
          type: memoryValueType(value),
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

  public render(options: { turn: number; now?: number; maxChars?: number; inspector?: Inspector }): string {
    return renderMemory({ ...options, bindings: this.bindings, properties: this.objectProperties })
  }

  public serialize(): SerializedMemory {
    return {
      version: 2,
      maxBytes: this.maxBytes,
      variables: [...this._bindings].map(([name, binding]) => ({
        name,
        ...binding,
        value: encodeMemoryValue(binding.value),
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
      objects: [...this._objectProperties.values()].map((property) => ({
        ...property,
        value: encodeMemoryValue(property.value),
        hostValue: encodeMemoryValue(property.hostValue),
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

  public static restore(state: SerializedMemory, additionalBytes?: () => number): Memory {
    if (state.version !== 2) {
      throw new InvalidConfigurationError('Unsupported memory version')
    }

    const memory = new Memory({
      maxBytes: state.maxBytes,
      additionalBytes,
    })
    for (const binding of state.variables) {
      memory._assertName(binding.name)
      if (memory._bindings.has(binding.name)) {
        throw new InvalidConfigurationError('Duplicate persisted memory binding')
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

    memory.assertCapacity()
    return memory
  }

  public assertCapacity(additionalBytes = 0): void {
    // Both exact state and the owning Session's result records count toward the limit.
    const bytes = new TextEncoder().encode(JSON.stringify(this.serialize())).byteLength
    if (bytes + this._additionalBytes() + additionalBytes > this.maxBytes) {
      throw new MemoryCapacityError(this.maxBytes)
    }
  }
}
