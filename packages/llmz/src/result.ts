import type { Context, Iteration } from './context.js'
import { describeError, InternalError, isLLMzError, type LLMzFailure } from './errors.js'
import type { Exit, ExitResult } from './exit.js'
import type { Session } from './session/session.js'

type ExecutionStatus = 'success' | 'error'

type ResultSummary = {
  sessionId: string
  tokens: { input: number; output: number; total: number }
}

export namespace ExecutionResult {
  export type JSON = SuccessExecutionResult.JSON | ErrorExecutionResult.JSON
}

/** An execution outcome. Persist Session separately; diagnostics belong to this run. */
export abstract class ExecutionResult {
  protected constructor(
    public readonly status: ExecutionStatus,
    public readonly context: Context
  ) {}

  public isSuccess(): this is SuccessExecutionResult {
    return this instanceof SuccessExecutionResult
  }

  public isError(): this is ErrorExecutionResult {
    return this instanceof ErrorExecutionResult
  }

  public is<T>(exit: Exit<T>): this is SuccessExecutionResult<T> {
    return this.isSuccess() && this.result.exit === exit
  }

  public get session(): Session {
    return this.context.session
  }

  public get output(): unknown {
    return this.isSuccess() ? this.result.result : null
  }

  public get iteration(): Iteration | null {
    return this.context.iterations.at(-1) ?? null
  }

  public get iterations(): Iteration[] {
    return this.context.iterations
  }

  public get tokens(): ResultSummary['tokens'] {
    let input = 0
    let output = 0

    for (const iteration of this.iterations) {
      input += iteration.tokens?.input ?? 0
      output += iteration.tokens?.output ?? 0
    }

    return { input, output, total: input + output }
  }

  /** Explicit diagnostic export without conversation or memory persistence. */
  public diagnostics(): Context.JSON {
    return this.context.toJSON()
  }

  public abstract toJSON(): ExecutionResult.JSON
}

export namespace SuccessExecutionResult {
  export type JSON = ResultSummary & {
    status: 'success'
    exit: string
    output: unknown
  }
}

export class SuccessExecutionResult<TOutput = unknown> extends ExecutionResult {
  public constructor(
    context: Context,
    public readonly result: ExitResult<TOutput>
  ) {
    super('success', context)
  }

  public get output(): TOutput {
    return this.result.result
  }

  public get iteration(): Iteration {
    return this.context.iterations.at(-1)!
  }

  public toJSON(): SuccessExecutionResult.JSON {
    return {
      status: 'success',
      sessionId: this.session.id,
      exit: this.result.exit.name,
      output: this.output,
      tokens: this.tokens,
    }
  }
}

export namespace ErrorExecutionResult {
  export type JSON = ResultSummary & {
    status: 'error'
    error: unknown
  }
}

export class ErrorExecutionResult extends ExecutionResult {
  public readonly error: LLMzFailure
  public constructor(context: Context, error: unknown) {
    super('error', context)
    this.error = isLLMzError(error)
      ? error
      : new InternalError(error instanceof Error ? error.message : String(error), { cause: error })
  }

  public get output(): null {
    return null
  }

  public toJSON(): ErrorExecutionResult.JSON {
    return {
      status: 'error',
      sessionId: this.session.id,
      error: describeError(this.error),
      tokens: this.tokens,
    }
  }
}
