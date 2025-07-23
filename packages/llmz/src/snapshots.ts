import { ulid } from 'ulid'

import { ToolCall, SnapshotSignal } from './errors.js'
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

/**
 * Snapshot represents a captured execution state that can be persisted and restored later.
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
 * - **Execution stack**: Current code position and call stack
 * - **Variables**: All local variables and their values (up to size limit)
 * - **Tool context**: Information about the tool call that triggered the snapshot
 * - **Reason**: Human-readable description of why the snapshot was created
 *
 * @see {@link https://github.com/botpress/botpress/blob/master/packages/llmz/examples/14_worker_snapshot/index.ts} Example usage
 */
export class Snapshot {
  public readonly id: string
  public readonly reason?: string
  public readonly stack: string
  public readonly variables: Variable[]
  public readonly toolCall?: ToolCall
  #status: SnapshotStatus

  /**
   * Gets the current status of the snapshot.
   *
   * @returns The snapshot status (pending, resolved, or rejected)
   */
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
  public toJSON() {
    return {
      id: this.id,
      reason: this.reason,
      stack: this.stack,
      variables: this.variables,
      toolCall: this.toolCall,
      status: this.#status,
    }
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
  public static fromJSON(json: {
    id: string
    reason?: string
    stack: string
    variables: Variable[]
    toolCall?: ToolCall
    status: SnapshotStatus
  }) {
    return new Snapshot({
      id: json.id,
      reason: json.reason,
      stack: json.stack,
      variables: json.variables,
      toolCall: json.toolCall,
      status: json.status,
    })
  }

  /**
   * Creates a deep copy of the snapshot.
   *
   * @returns A new Snapshot instance with identical data
   */
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

  /**
   * Resets the snapshot status back to pending.
   *
   * This allows a previously resolved or rejected snapshot to be resolved/rejected
   * again with different data. Useful for retry scenarios.
   */
  public reset() {
    this.#status = { type: 'pending' }
  }

  /**
   * Resolves the snapshot with a successful result value.
   *
   * Call this method when the long-running operation that caused the snapshot
   * has completed successfully. The provided value will be returned as the
   * result of the original tool call when execution resumes.
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
  public resolve(value: any) {
    if (this.#status.type !== 'pending') {
      throw new Error(`Cannot resolve snapshot because it is already settled: ${this.#status.type}`)
    }

    this.#status = { type: 'resolved', value }
  }

  /**
   * Rejects the snapshot with an error.
   *
   * Call this method when the long-running operation that caused the snapshot
   * has failed or encountered an error. The provided error will be thrown
   * when execution resumes, allowing the generated code to handle it.
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
   * // Continue execution (will throw the error)
   * const continuation = await execute({ snapshot, ... })
   * ```
   */
  public reject(error: any) {
    if (this.#status.type !== 'pending') {
      throw new Error(`Cannot reject snapshot because it is already settled: ${this.#status.type}`)
    }

    this.#status = { type: 'rejected', error }
  }
}
