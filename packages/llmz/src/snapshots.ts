import { ulid } from 'ulid'

import { ToolCall, SnapshotSignal } from './errors.js'
import { extractType, inspect } from './inspect.js'
import { Memory, type SerializedMemory } from './memory.js'
import { Session } from './session.js'
import { restoreSnapshotAssignment } from './snapshot-assignment.js'
import { Serializable } from './types.js'

const MAX_SNAPSHOT_SIZE_BYTES = 4_000
const MAX_INTERRUPTION_LENGTH = 2_000

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

export namespace Snapshot {
  export type PendingCall = {
    iterationId: string
    callId: string
    code?: string
    /** A failed response transport does not discard an already-started operation. */
    interruption?: string
    /** Bounded disclosure when a host hook replaced the assistant's requested source. */
    executionOverride?: string
  }

  export type JSON = {
    id: string
    reason?: string
    stack: string
    variables: Variable[]
    toolCall?: ToolCall
    status: SnapshotStatus
    /** Native snapshots persist exact memory and the unresolved outer call. */
    native?: {
      version: 1
      session: Session.JSON
      pendingCall: PendingCall
      settlement?: SerializedMemory
      assignmentError?: string
    }
  }
}

/**
 * Snapshot represents captured memory and an interrupted operation, persisted
 * with the native assistant call needed to continue the conversation later.
 *
 * Snapshots are created when a SnapshotSignal is thrown during execution, typically from
 * within a tool handler to pause execution for long-running operations that need to be
 * completed asynchronously (e.g., background jobs, external API calls, user input).
 *
 * ## Use Cases
 * - **Long-running operations**: Pause execution while waiting for external processes
 * - **User interaction**: Collect input from users before continuing execution
 * - **Resource management**: Defer expensive operations to background workers
 * - **Workflow persistence**: Save execution state across process restarts
 *
 * ## Basic Usage
 *
 * ### Creating a Snapshot
 * From within a tool handler, throw a SnapshotSignal to create a snapshot:
 * ```typescript
 * const tool = new Tool({
 *   handler: async ({ input }) => {
 *     // Start long-running operation
 *     throw new SnapshotSignal('Waiting for external API response')
 *   }
 * })
 * ```
 *
 * ### Handling Interrupted Execution
 * ```typescript
 * const result = await execute({ tools: [tool], ... })
 *
 * if (result.isInterrupted()) {
 *   const snapshot = result.snapshot
 *
 *   // Serialize for persistence
 *   const serialized = snapshot.toJSON()
 *   await database.saveSnapshot(serialized)
 * }
 * ```
 *
 * ### Resuming from Snapshot
 * ```typescript
 * // Restore from persistence
 * const serialized = await database.getSnapshot(id)
 * const snapshot = Snapshot.fromJSON(serialized)
 *
 * // Resolve with the result of the long-running operation
 * snapshot.resolve({ result: 'Operation completed!' })
 *
 * // Continue execution
 * const continuation = await execute({
 *   snapshot,
 *   instructions: originalInstructions,
 *   tools: originalTools,
 *   exits: originalExits,
 *   client
 * })
 * ```
 *
 * ## Snapshot Lifecycle
 * 1. **Created**: When SnapshotSignal is thrown (status: pending)
 * 2. **Serialized**: Convert to JSON for persistence with toJSON()
 * 3. **Restored**: Recreate from JSON with fromJSON()
 * 4. **Resolved/Rejected**: Provide result data with resolve() or reject()
 * 5. **Resumed**: Continue execution with the resolved snapshot
 *
 * ## What's Captured
 * - **Executed prefix**: Code position and trace; not a resumable instruction pointer
 * - **Variables**: Exact supported session values and assignment provenance
 * - **Native history**: Assistant call, matching identity, and adapter continuation data
 * - **Tool context**: Information about the tool call that triggered the snapshot
 * - **Reason**: Human-readable description of why the snapshot was created
 *
 * @see {@link https://github.com/botpress/botpress/blob/master/packages/llmz/examples/14_worker_snapshot/index.ts} Example usage
 */
export class Snapshot implements Serializable<Snapshot.JSON> {
  public readonly id: string
  public readonly reason?: string
  public readonly stack: string
  public readonly toolCall?: ToolCall
  public variables: Variable[]
  #status: SnapshotStatus
  #native?: Snapshot.JSON['native']
  #resumeConsumed = false

  public get session(): Session.JSON | undefined {
    return this.#native ? structuredClone(this.#native.session) : undefined
  }

  public get pendingCall(): Snapshot.PendingCall | undefined {
    return this.#native ? { ...this.#native.pendingCall } : undefined
  }

  public get assignmentError(): string | undefined {
    return this.#native?.assignmentError
  }

  /**
   * Claim this resolved/rejected snapshot object for one resumption. The runtime
   * calls this after validating input and immediately before settling its call.
   * Hosts must separately claim persisted snapshots atomically: clones and
   * separately restored objects do not share this in-memory guard.
   * @internal
   */
  public consumeResume(): void {
    if (!this.#native || this.#status.type === 'pending') {
      throw new Error('Only a settled native snapshot can be resumed')
    }

    if (this.#resumeConsumed) {
      throw new Error('This snapshot has already been resumed. Continue using the resulting session instead.')
    }

    this.#resumeConsumed = true
  }

  /** Attach the native call before returning an interrupted execution. */
  public attachSession(session: Session, pendingCall: Snapshot.PendingCall): void {
    if (
      !session.pendingCalls.some(
        (call) => call.iterationId === pendingCall.iterationId && call.callId === pendingCall.callId
      )
    ) {
      throw new Error('The snapshot must reference an unresolved native call in its session.')
    }

    this.#native = { version: 1, session: session.toJSON(), pendingCall: normalizePendingCall(pendingCall) }
    this.variables = exactVariables(session.memory.variables)
  }

  /**
   * Gets the current status of the snapshot.
   *
   * @returns The snapshot status (pending, resolved, or rejected)
   */
  public get status(): Readonly<SnapshotStatus> {
    const status = this.#native ? structuredClone(this.#status) : { ...this.#status }

    return Object.freeze(status)
  }

  private constructor(props: {
    id: string
    stack: string
    reason?: string
    variables: Variable[]
    toolCall?: ToolCall
    status: SnapshotStatus
    native?: Snapshot.JSON['native']
  }) {
    this.id = props.id
    this.stack = props.stack
    this.reason = props.reason
    this.variables = props.variables
    this.toolCall = props.toolCall
    this.#status = props.status
    this.#native = props.native
  }

  /**
   * Creates a new Snapshot from a SnapshotSignal.
   *
   * This method is called internally by the LLMz execution engine when a SnapshotSignal
   * is thrown during execution. It captures the current execution state including
   * variables, stack trace, and tool context.
   *
   * @param signal The SnapshotSignal containing execution state
   * @returns A new Snapshot instance in pending status
   * @internal
   */
  public static fromSignal(signal: SnapshotSignal): Snapshot {
    return new Snapshot({
      id: 'snapshot_' + ulid(),
      reason: signal.message,
      stack: signal.truncatedCode,
      variables: parseVariables(signal.variables),
      toolCall: signal.toolCall,
      status: { type: 'pending' },
    })
  }

  /**
   * Serializes the snapshot to a JSON-compatible object for persistence.
   *
   * Use this method to save snapshots to databases, files, or other storage systems.
   * The serialized snapshot can be restored later using fromJSON().
   *
   * @returns A JSON-serializable representation of the snapshot
   * @example
   * ```typescript
   * const snapshot = result.snapshot
   * const serialized = snapshot.toJSON()
   * await database.save('snapshots', snapshot.id, serialized)
   * ```
   */
  public toJSON(): Snapshot.JSON {
    return {
      id: this.id,
      reason: this.reason,
      stack: this.stack,
      variables: this.variables,
      toolCall: this.toolCall,
      status: this.#status,
      ...(this.#native ? { native: structuredClone(this.#native) } : {}),
    } satisfies Snapshot.JSON
  }

  /**
   * Restores a snapshot from its JSON representation.
   *
   * Use this method to recreate snapshots from persistent storage. The restored
   * snapshot will maintain its original state and can be resolved/rejected as needed.
   *
   * @param json The serialized snapshot data from toJSON()
   * @returns A restored Snapshot instance
   * @example
   * ```typescript
   * const serialized = await database.get('snapshots', snapshotId)
   * const snapshot = Snapshot.fromJSON(serialized)
   * ```
   */
  public static fromJSON(json: Snapshot.JSON): Snapshot {
    if (json.native && json.native.version !== 1) {
      throw new Error('Unsupported native snapshot version')
    }

    const native = json.native ? structuredClone(json.native) : undefined
    if (native) {
      native.pendingCall = normalizePendingCall(native.pendingCall)
    }

    const session = native ? Session.fromJSON(native.session) : undefined
    const status = structuredClone(json.status)

    if (native?.settlement) {
      const value = Memory.restore(native.settlement).variables.snapshotValue

      if (status.type === 'resolved') {
        status.value = value
      }

      if (status.type === 'rejected') {
        status.error = value
      }
    }

    return new Snapshot({
      id: json.id,
      reason: json.reason,
      stack: json.stack,
      variables: session ? exactVariables(session.memory.variables) : structuredClone(json.variables),
      toolCall: structuredClone(json.toolCall),
      status,
      native,
    })
  }

  /**
   * Creates a deep copy of the snapshot.
   *
   * @returns A new Snapshot instance with identical data
   */
  public clone(): Snapshot {
    return Snapshot.fromJSON(this.toJSON())
  }

  /**
   * Resets the snapshot status back to pending.
   *
   * This allows a previously resolved or rejected snapshot to be resolved/rejected
   * again with different data. Useful for retry scenarios.
   */
  public reset(): void {
    if (this.#native && this.#status.type !== 'pending') {
      throw new Error(
        'A settled native snapshot cannot be reset; resolved assignments are already retained in its session.'
      )
    }

    this.#status = { type: 'pending' }
  }

  /**
   * Resolves the snapshot with a successful result value.
   *
   * Call this method when the long-running operation that caused the snapshot
   * has completed successfully. Native snapshots retain the assigned value and
   * report the inner operation's outcome to the model. The remaining JavaScript
   * does not resume and the value does not become the program's $return.
   *
   * @param value The result value from the completed operation
   * @throws Error if the snapshot is not in pending status
   * @example
   * ```typescript
   * // After a background job completes
   * const result = await backgroundJob.getResult()
   * snapshot.resolve(result)
   *
   * // Continue execution
   * const continuation = await execute({ snapshot, ... })
   * ```
   */
  public resolve(value: unknown): void {
    if (this.#status.type !== 'pending') {
      throw new Error(`Cannot resolve snapshot because it is already settled: ${this.#status.type}`)
    }

    // Validate exact persistence before changing any assignment or lifecycle state.
    const settlement = this.#native
      ? new Memory({ variables: { snapshotValue: value }, maxBytes: this.#native.session.memory.maxBytes }).serialize()
      : undefined
    const assignment = this.toolCall?.assignment

    if (assignment) {
      try {
        const assignmentValue = restoreSnapshotAssignment(assignment, value)

        if (this.#native) {
          const session = Session.fromJSON(this.#native.session)
          const source = this.#native.session.groups.find(
            (group) => group.iteration?.id === this.#native!.pendingCall.iterationId
          )?.iteration

          if (!source) {
            throw new Error('Missing interrupted iteration identity')
          }

          const timestamp = Date.now()
          const report = session.memory.assign(assignmentValue, {
            ...source,
            timestamp,
            variableWrites: Object.keys(assignmentValue).map((name) => ({ name, timestamp })),
          })
          this.#native.session = session.toJSON()
          this.variables = exactVariables(session.memory.variables)

          if (report.unavailable.length) {
            this.#native.assignmentError = report.unavailable.map((item) => `${item.name}: ${item.reason}`).join('; ')
          }
        } else {
          const replacements = new Set(Object.keys(assignmentValue))
          this.variables = [
            ...this.variables.filter((variable) => !replacements.has(variable.name)),
            ...parseVariables(assignmentValue),
          ]
        }
      } catch (error) {
        if (this.#native) {
          this.#native.assignmentError = error instanceof Error ? error.message : String(error)
        }
      }
    }

    if (this.#native) {
      this.#native.settlement = settlement
    }

    const retainedValue = settlement ? Memory.restore(settlement).variables.snapshotValue : value
    this.#status = { type: 'resolved', value: retainedValue }
  }

  /**
   * Rejects the snapshot with an error.
   *
   * Call this method when the long-running operation that caused the snapshot
   * has failed or encountered an error. On continuation, the model receives
   * this failure as the outcome of the interrupted inner operation and can
   * generate a recovery program. The original JavaScript does not resume.
   *
   * @param error The error that occurred during the operation
   * @throws Error if the snapshot is not in pending status
   * @example
   * ```typescript
   * try {
   *   const result = await externalAPI.call()
   *   snapshot.resolve(result)
   * } catch (error) {
   *   snapshot.reject(error)
   * }
   *
   * // Continue model iteration with the failed operation's outcome
   * const continuation = await execute({ snapshot, ... })
   * ```
   */
  public reject(error: unknown): void {
    if (this.#status.type !== 'pending') {
      throw new Error(`Cannot reject snapshot because it is already settled: ${this.#status.type}`)
    }

    if (this.#native) {
      const value = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
      this.#native.settlement = new Memory({
        variables: { snapshotValue: value },
        maxBytes: this.#native.session.memory.maxBytes,
      }).serialize()
      this.#status = { type: 'rejected', error: Memory.restore(this.#native.settlement).variables.snapshotValue }

      return
    }

    this.#status = { type: 'rejected', error }
  }
}

function normalizePendingCall(pendingCall: Snapshot.PendingCall): Snapshot.PendingCall {
  const normalized = { ...pendingCall }

  if (normalized.interruption !== undefined) {
    normalized.interruption = normalized.interruption
      .replace(/bp_pat_[A-Za-z0-9]+/g, '[REDACTED]')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .slice(0, MAX_INTERRUPTION_LENGTH)
  }

  if (normalized.executionOverride !== undefined) {
    normalized.executionOverride = normalized.executionOverride
      .replace(/bp_pat_[A-Za-z0-9]+/g, '[REDACTED]')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .slice(0, 6000)
  }

  return normalized
}

function parseVariables(variableMap: { [key: string]: any }) {
  return Object.entries(variableMap).map(([name, value]) => {
    const type = extractType(value)
    let bytes = 0
    let unsupported = false

    try {
      const serialized = JSON.stringify(value)
      unsupported = serialized === undefined && value !== undefined
      bytes = serialized?.length ?? 0
    } catch {
      unsupported = true
    }

    const truncated = unsupported || bytes > MAX_SNAPSHOT_SIZE_BYTES
    let preview = 'Unavailable: value could not be serialized'

    if (truncated && !unsupported) {
      try {
        preview = inspect(value, name) ?? 'N/A'
      } catch {
        /* A preview failure must not lose an interrupted side effect. */
      }
    }

    return truncated
      ? ({ name, type, bytes, truncated: true, preview } satisfies Variable)
      : ({ name, type, bytes, truncated: false, value } satisfies Variable)
  })
}

function exactVariables(variables: Record<string, unknown>): Variable[] {
  return Object.entries(variables).map(([name, value]) => ({
    name,
    type: extractType(value),
    bytes: JSON.stringify(value)?.length ?? 0,
    value,
    truncated: false,
  }))
}
