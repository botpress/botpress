import { Context, Iteration } from './context.js'
import { SnapshotSignal } from './errors.js'
import { Exit, ExitResult } from './exit.js'
import { Serialized } from './serialization.js'
import { Snapshot } from './snapshots.js'

type ExecutionStatus = 'success' | 'error' | 'interrupted'

export abstract class ExecutionResult {
  public readonly status: ExecutionStatus
  public readonly context: Context

  protected constructor(status: ExecutionStatus, context: Context) {
    this.status = status
    this.context = context
  }

  public isSuccess(): this is SuccessExecutionResult {
    return this.status === 'success' && this instanceof SuccessExecutionResult
  }

  public isError(): this is ErrorExecutionResult {
    return this.status === 'error' && this instanceof ErrorExecutionResult
  }

  public isInterrupted(): this is PartialExecutionResult {
    return this.status === 'interrupted' && this instanceof PartialExecutionResult
  }

  public is<T>(exit: Exit<T>): this is SuccessExecutionResult<T> {
    return this.status === 'success' && this instanceof SuccessExecutionResult && this.result.exit === exit
  }

  public get output(): unknown | null {
    return this.isSuccess() ? this.result.result : null
  }

  public get iteration(): Iteration | null {
    return this.context.iterations.at(-1) || null
  }

  public get iterations(): Iteration[] {
    return this.context.iterations ?? []
  }

  public abstract toJSON(): {
    status: ExecutionStatus
    context: Serialized.Context
    [key: string]: any
  }
}

export class SuccessExecutionResult<TOutput = unknown> extends ExecutionResult {
  public readonly result: ExitResult<TOutput>

  public constructor(context: Context, result: ExitResult<TOutput>) {
    super('success', context)
    this.result = result
  }

  public get output(): TOutput {
    return this.result.result
  }

  public get iteration(): Iteration {
    return this.context.iterations.at(-1)!
  }

  public toJSON() {
    return {
      status: 'success' as const,
      context: this.context.toJSON(),
      result: {
        exit: this.result.exit.toJSON(),
        result: this.result.result,
      },
    }
  }
}

export class ErrorExecutionResult extends ExecutionResult {
  public readonly error: unknown

  public constructor(context: Context, error: unknown) {
    super('error', context)
    this.error = error
  }

  public get output(): null {
    return null
  }

  public toJSON() {
    return {
      status: 'error' as const,
      context: this.context.toJSON(),
      error: this.error,
    }
  }
}

export class PartialExecutionResult extends ExecutionResult {
  public readonly signal: SnapshotSignal
  public readonly snapshot: Snapshot

  public constructor(context: Context, signal: SnapshotSignal, snapshot: Snapshot) {
    super('interrupted', context)
    this.signal = signal
    this.snapshot = snapshot
  }

  public get output(): null {
    return null
  }

  public toJSON() {
    return {
      status: 'interrupted' as const,
      context: this.context.toJSON(),
      snapshot: this.snapshot.toJSON(),
      signal: {
        message: this.signal.message,
        truncatedCode: this.signal.truncatedCode,
        variables: this.signal.variables,
      },
    }
  }
}

export type AnyExecutionResult =
  | ExecutionResult
  | SuccessExecutionResult
  | ErrorExecutionResult
  | PartialExecutionResult
