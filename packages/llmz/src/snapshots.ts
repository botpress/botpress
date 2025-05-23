import { ulid } from 'ulid'

import { ToolCall, VMInterruptSignal } from './errors.js'
import { extractType, inspect } from './inspect.js'

const MAX_SNAPSHOT_SIZE_BYTES = 4_000

type Variable = {
  name: string
  type: string
  bytes: number
  preview?: string
  value?: unknown
  truncated: boolean
} & ({ truncated: true; preview: string } | { truncated: false; value: unknown })

export type SnapshotStatus = SnapshotStatuses.Pending | SnapshotStatuses.Resolved | SnapshotStatuses.Rejected

export namespace SnapshotStatuses {
  export type Pending = { type: 'pending' }
  export type Resolved = { type: 'resolved'; value: unknown }
  export type Rejected = { type: 'rejected'; error: unknown }
}

export class Snapshot {
  public readonly id: string
  public readonly reason?: string
  public readonly stack: string
  public readonly variables: Variable[]
  public readonly toolCall?: ToolCall
  #status: SnapshotStatus

  public get status() {
    return Object.freeze({ ...this.#status })
  }

  private constructor(props: {
    id: string
    stack: string
    reason?: string
    variables: Variable[]
    toolCall?: ToolCall
    status: SnapshotStatus
  }) {
    this.id = props.id
    this.stack = props.stack
    this.reason = props.reason
    this.variables = props.variables
    this.toolCall = props.toolCall
    this.#status = props.status
  }

  public static fromSignal(signal: VMInterruptSignal): Snapshot {
    const variables = Object.entries(signal.variables).map(([name, value]) => {
      const type = extractType(value)
      const bytes = JSON.stringify(value || '').length
      const truncated = bytes > MAX_SNAPSHOT_SIZE_BYTES

      return truncated
        ? ({ name, type, bytes, truncated: true, preview: inspect(value, name) ?? 'N/A' } satisfies Variable)
        : ({ name, type, bytes, truncated: false, value } satisfies Variable)
    })

    return new Snapshot({
      id: 'snapshot_' + ulid(),
      reason: signal.message,
      stack: signal.truncatedCode,
      variables,
      toolCall: signal.toolCall,
      status: { type: 'pending' },
    })
  }

  public toJSON() {
    return {
      id: this.id,
      reason: this.reason,
      stack: this.stack,
      variables: this.variables,
      toolCall: this.toolCall,
    }
  }

  public static fromJSON(json: Snapshot) {
    return new Snapshot({
      id: json.id,
      reason: json.reason,
      stack: json.stack,
      variables: json.variables,
      toolCall: json.toolCall,
      status: json.status,
    })
  }

  public clone() {
    return new Snapshot({
      id: this.id,
      reason: this.reason,
      stack: this.stack,
      variables: this.variables,
      toolCall: this.toolCall,
      status: this.#status,
    })
  }

  public reset() {
    this.#status = { type: 'pending' }
  }

  public resolve(value: any) {
    if (this.#status.type !== 'pending') {
      throw new Error(`Cannot resolve snapshot because it is already settled: ${this.#status.type}`)
    }

    this.#status = { type: 'resolved', value }
  }

  public reject(error: any) {
    if (this.#status.type !== 'pending') {
      throw new Error(`Cannot reject snapshot because it is already settled: ${this.#status.type}`)
    }

    this.#status = { type: 'rejected', error }
  }
}
