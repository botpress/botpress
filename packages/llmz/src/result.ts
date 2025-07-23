import { Context, Iteration } from './context.js'
import { SnapshotSignal } from './errors.js'
import { Exit, ExitResult } from './exit.js'
import { Snapshot } from './snapshots.js'

/**
 * Base class for all execution results returned by the `execute()` function.
 *
 * ExecutionResult provides a type-safe way to handle the different outcomes of LLMz
 * agent execution. All results contain the execution context and provide methods
 * to check the final status and access relevant data.
 *
 * ## Result Types
 *
 * LLMz execution can result in three different outcomes:
 * - **Success**: Agent completed with an Exit (SuccessExecutionResult)
 * - **Error**: Execution failed with an unrecoverable error (ErrorExecutionResult)
 * - **Interrupted**: Execution was paused for snapshots or cancellation (PartialExecutionResult)
 *
 * ## Usage Patterns
 *
 * ### Basic Status Checking
 * ```typescript
 * const result = await execute({
 *   instructions: 'Calculate the sum of numbers 1 to 100',
 *   client,
 * })
 *
 * if (result.isSuccess()) {
 *   console.log('Success:', result.output)
 * } else if (result.isError()) {
 *   console.error('Error:', result.error)
 * } else if (result.isInterrupted()) {
 *   console.log('Interrupted - snapshot available:', !!result.snapshot)
 * }
 * ```
 *
 * ### Type-Safe Exit Checking
 * ```typescript
 * const dataExit = new Exit({
 *   name: 'dataProcessed',
 *   schema: z.object({
 *     recordCount: z.number(),
 *     processingTime: z.number(),
 *   }),
 * })
 *
 * const result = await execute({
 *   instructions: 'Process the data',
 *   exits: [dataExit],
 *   client,
 * })
 *
 * // Type-safe exit checking with typed output access
 * if (result.is(dataExit)) {
 *   console.log(`Processed ${result.output.recordCount} records`)
 *   console.log(`Processing took ${result.output.processingTime}ms`)
 * }
 * ```
 *
 * ### Accessing Execution Details
 * ```typescript
 * if (result.isSuccess()) {
 *   // Access the generated code from the final iteration
 *   console.log('Generated code:', result.iteration.code)
 *
 *   // Access all iterations to see the full execution flow
 *   result.iterations.forEach((iteration, index) => {
 *     console.log(`Iteration ${index + 1}:`, iteration.status.type)
 *   })
 *
 *   // Access execution context
 *   console.log('Original instructions:', result.context.instructions)
 * }
 * ```
 *
 * ### Snapshot Handling
 * ```typescript
 * if (result.isInterrupted()) {
 *   // Serialize snapshot for persistence
 *   const serialized = result.snapshot.toJSON()
 *   await database.saveSnapshot(serialized)
 *
 *   // Later, resume from snapshot
 *   const snapshot = Snapshot.fromJSON(serialized)
 *   snapshot.resolve({ data: 'resolved data' })
 *
 *   const continuation = await execute({
 *     snapshot,
 *     instructions: result.context.instructions,
 *     tools: result.context.tools,
 *     exits: result.context.exits,
 *     client,
 *   })
 * }
 * ```
 *
 * @see {@link SuccessExecutionResult} For successful execution results
 * @see {@link ErrorExecutionResult} For failed execution results
 * @see {@link PartialExecutionResult} For interrupted execution results
 */
export abstract class ExecutionResult {
  public readonly status: 'success' | 'error' | 'interrupted'
  public readonly context: Context

  protected constructor(status: 'success' | 'error' | 'interrupted', context: Context) {
    this.status = status
    this.context = context
  }

  /**
   * Type guard to check if the execution completed successfully.
   *
   * @returns True if the execution completed with an Exit, false otherwise
   * @example
   * ```typescript
   * const result = await execute({ ... })
   *
   * if (result.isSuccess()) {
   *   // TypeScript knows this is SuccessExecutionResult
   *   console.log('Output:', result.output)
   *   console.log('Exit name:', result.result.exit.name)
   * }
   * ```
   */
  public isSuccess(): this is SuccessExecutionResult {
    return this.status === 'success' && this instanceof SuccessExecutionResult
  }

  /**
   * Type guard to check if the execution failed with an error.
   *
   * @returns True if the execution failed with an unrecoverable error, false otherwise
   * @example
   * ```typescript
   * const result = await execute({ ... })
   *
   * if (result.isError()) {
   *   // TypeScript knows this is ErrorExecutionResult
   *   console.error('Execution failed:', result.error)
   *
   *   // Access error details from the last iteration
   *   const lastIteration = result.iteration
   *   if (lastIteration?.status.type === 'execution_error') {
   *     console.error('Stack trace:', lastIteration.status.execution_error.stack)
   *   }
   * }
   * ```
   */
  public isError(): this is ErrorExecutionResult {
    return this.status === 'error' && this instanceof ErrorExecutionResult
  }

  /**
   * Type guard to check if the execution was interrupted.
   * Interrupted means there's a snapshot available and the execution was paused and needs resuming.
   *
   * @returns True if the execution was interrupted, false otherwise
   * @example
   * ```typescript
   * const result = await execute({ ... })
   *
   * if (result.isInterrupted()) {
   *   // TypeScript knows this is PartialExecutionResult
   *   console.log('Execution paused:', result.signal.message)
   *
   *   // Access snapshot for later resumption
   *   const snapshot = result.snapshot
   *   const serialized = snapshot.toJSON()
   *   await storage.save('execution-state', serialized)
   * }
   * ```
   */
  public isInterrupted(): this is PartialExecutionResult {
    return this.status === 'interrupted' && this instanceof PartialExecutionResult
  }

  /**
   * Type guard to check if the execution completed with a specific exit.
   *
   * This method provides type-safe access to the output data based on the exit's schema.
   * It's the recommended way to handle different exit types in complex agents.
   *
   * @param exit - The Exit instance to check against
   * @returns True if the execution completed with the specified exit, false otherwise
   * @template T - The output type of the exit
   *
   * @example
   * ```typescript
   * // Define typed exits
   * const successExit = new Exit({
   *   name: 'success',
   *   schema: z.object({
   *     message: z.string(),
   *     count: z.number(),
   *   }),
   * })
   *
   * const errorExit = new Exit({
   *   name: 'error',
   *   schema: z.object({
   *     errorCode: z.string(),
   *     details: z.string(),
   *   }),
   * })
   *
   * const result = await execute({
   *   instructions: 'Process the data',
   *   exits: [successExit, errorExit],
   *   client,
   * })
   *
   * // Type-safe exit handling
   * if (result.is(successExit)) {
   *   // TypeScript knows result.output has { message: string, count: number }
   *   console.log(`Success: ${result.output.message}`)
   *   console.log(`Processed ${result.output.count} items`)
   * } else if (result.is(errorExit)) {
   *   // TypeScript knows result.output has { errorCode: string, details: string }
   *   console.error(`Error ${result.output.errorCode}: ${result.output.details}`)
   * }
   * ```
   */
  public is<T>(exit: Exit<T>): this is SuccessExecutionResult<T> {
    return this.status === 'success' && this instanceof SuccessExecutionResult && this.result.exit === exit
  }

  /**
   * Gets the output data from the last successful iteration.
   *
   * For successful executions, returns the data produced by the exit.
   * For failed or interrupted executions, returns null.
   *
   * @returns The output data for successful executions, null otherwise
   * @example
   * ```typescript
   * const result = await execute({ ... })
   *
   * // Generic output access
   * if (result.isSuccess()) {
   *   console.log('Output:', result.output)
   * }
   *
   * // Type-safe output access with specific exits
   * if (result.is(myExit)) {
   *   // result.output is now typed based on myExit's schema
   *   console.log(result.output.specificField)
   * }
   * ```
   */
  public get output(): unknown | null {
    return this.isSuccess() ? this.result.result : null
  }

  /**
   * Gets the most recent (last) iteration from the execution.
   *
   * Iterations represent individual steps in the execution loop where the LLM
   * generates code, executes it, and processes the results. The last iteration
   * contains the final generated code and execution status.
   *
   * @returns The last iteration, or null if no iterations were completed
   * @example
   * ```typescript
   * const result = await execute({ ... })
   *
   * const lastIteration = result.iteration
   * if (lastIteration) {
   *   console.log('Generated code:', lastIteration.code)
   *   console.log('Status:', lastIteration.status.type)
   *   console.log('Variables:', lastIteration.variables)
   *   console.log('Tool calls:', lastIteration.toolCalls)
   * }
   * ```
   */
  public get iteration(): Iteration | null {
    return this.context.iterations.at(-1) || null
  }

  /**
   * Gets all iterations from the execution.
   *
   * This provides access to the complete execution history, showing how the agent
   * progressed through multiple iterations to reach the final result. Useful for
   * debugging, logging, or understanding the agent's reasoning process.
   *
   * @returns Array of all iterations in execution order
   * @example
   * ```typescript
   * const result = await execute({ ... })
   *
   * // Analyze the full execution flow
   * result.iterations.forEach((iteration, index) => {
   *   console.log(`Iteration ${index + 1}:`)
   *   console.log('  Status:', iteration.status.type)
   *   console.log('  Code length:', iteration.code?.length || 0)
   *   console.log('  Tool calls:', iteration.toolCalls.length)
   *   console.log('  Variables:', Object.keys(iteration.variables).length)
   * })
   *
   * // Find iterations with specific characteristics
   * const iterationsWithErrors = result.iterations.filter(
   *   iter => iter.status.type === 'execution_error'
   * )
   *
   * // Calculate total execution time
   * const totalTime = result.iterations.reduce(
   *   (sum, iter) => sum + (iter.duration || 0), 0
   * )
   * ```
   */
  public get iterations(): Iteration[] {
    return this.context.iterations ?? []
  }
}

/**
 * Result for successful executions that completed with an Exit.
 *
 * SuccessExecutionResult indicates that the agent successfully completed its task
 * and returned structured data through one of the provided exits. This is the
 * most common positive outcome for LLMz executions.
 *
 * In *Worker Mode* (ie. no `chat` provided), if no exits were provided, the "DefaultExit" will be used.
 * If *Chat Mode* is enabled, most likely the "ListenExit" will be used if no exits were provided.
 *
 * You can check for a specific exit using the `is()` method, which provides type-safe access to the output data of the exit.
 * You can import "ListenExit" and "DefaultExit" from `llmz`.
 *
 * @template TOutput - The type of the output data based on the exit schema
 *
 * @example
 * ```typescript
 * import { execute, Exit, DefaultExit, ListenExit } from 'llmz'
 *
 * const exit = new Exit({
 *   name: 'dataProcessed',
 *   schema: z.object({
 *     recordCount: z.number(),
 *     summary: z.string(),
 *   }),
 * })
 *
 * const result = await execute({
 *   instructions: 'Process the user data',
 *   exits: [exit],
 *   client,
 * })
 *
 * if (result.isSuccess() && result.is(exit)) {
 *   // Access the exit information
 *   console.log('Exit name:', result.result.exit.name)
 *
 *   // Access typed output data
 *   console.log('Records processed:', result.output.recordCount)
 *   console.log('Summary:', result.output.summary)
 *
 *   // Access the final iteration (guaranteed to exist)
 *   console.log('Generated code:', result.iteration.code)
 * }
 * ```
 */
export class SuccessExecutionResult<TOutput = unknown> extends ExecutionResult {
  public readonly result: ExitResult<TOutput>

  public constructor(context: Context, result: ExitResult<TOutput>) {
    super('success', context)
    this.result = result
  }

  /**
   * Gets the typed output data from the successful execution.
   *
   * This overrides the base class output property to provide proper typing
   * based on the exit schema. The output is guaranteed to match the schema
   * of the exit that was triggered.
   *
   * @returns The typed output data
   */
  public get output(): TOutput {
    return this.result.result
  }

  /**
   * Gets the final iteration from the successful execution.
   *
   * For successful executions, there is always at least one iteration,
   * so this method returns the guaranteed non-null final iteration.
   *
   * @returns The final iteration (guaranteed to exist)
   */
  public get iteration(): Iteration {
    return this.context.iterations.at(-1)!
  }
}

/**
 * Result for executions that failed with an unrecoverable error.
 *
 * ErrorExecutionResult indicates that the execution encountered an error that could not be recovered from, such as:
 * - Execution has been aborted by the user (eg. via the `signal` AbortSignal parameter)
 * - Iterations exceeded the maximum allowed limit
 *
 * Upon iteration failure, the execution will continue until the maximum iteration limit is reached or an exit is triggered.
 *
 * @example
 * ```typescript
 * const result = await execute({
 *   instructions: 'Call a non-existent function',
 *   client,
 * })
 *
 * if (result.isError()) {
 *   console.error('Execution failed:', result.error)
 *
 *   // Access error details from the last iteration
 *   const lastIteration = result.iteration
 *   if (lastIteration?.status.type === 'execution_error') {
 *     console.error('Error type:', lastIteration.status.execution_error.type)
 *     console.error('Stack trace:', lastIteration.status.execution_error.stack)
 *     console.error('Generated code:', lastIteration.code)
 *   }
 *
 *   // Access all iterations to understand the failure progression
 *   console.log('Total iterations before failure:', result.iterations.length)
 * }
 * ```
 */
export class ErrorExecutionResult extends ExecutionResult {
  public readonly error: unknown

  public constructor(context: Context, error: unknown) {
    super('error', context)
    this.error = error
  }

  /**
   * Gets the output data (always null for error results).
   *
   * @returns Always null since error executions don't produce output
   */
  public get output(): null {
    return null
  }
}

/**
 * Result for executions that were interrupted before completion.
 *
 * PartialExecutionResult indicates that a snapshot was created during the execution.
 * Interrupted executions can be resumed using the provided snapshot.
 *
 * @example
 * ```typescript
 * // Tool that throws SnapshotSignal for long-running operations
 * const longRunningTool = new Tool({
 *   name: 'processLargeDataset',
 *   async handler({ datasetId }) {
 *     // Start background processing
 *     const jobId = await startBackgroundJob(datasetId)
 *
 *     // Pause execution until job completes
 *     throw new SnapshotSignal('Processing dataset', 'Waiting for background job completion', {
 *       jobId,
 *       datasetId,
 *       startTime: Date.now(),
 *     })
 *   },
 * })
 *
 * const result = await execute({
 *   instructions: 'Process the large dataset',
 *   tools: [longRunningTool],
 *   client,
 * })
 *
 * if (result.isInterrupted()) {
 *   console.log('Execution paused:', result.signal.message)
 *   console.log('Reason:', result.signal.longMessage)
 *
 *   // Serialize snapshot for later resumption
 *   const serialized = result.snapshot.toJSON()
 *   await database.saveSnapshot('job-123', serialized)
 *
 *   // Later, when the background job completes...
 *   const snapshot = Snapshot.fromJSON(serialized)
 *   snapshot.resolve({ jobResult: 'Processing completed successfully' })
 *
 *   const continuation = await execute({
 *     snapshot,
 *     instructions: result.context.instructions,
 *     tools: result.context.tools,
 *     exits: result.context.exits,
 *     client,
 *   })
 * }
 * ```
 */
export class PartialExecutionResult extends ExecutionResult {
  public readonly signal: SnapshotSignal
  public readonly snapshot: Snapshot

  public constructor(context: Context, signal: SnapshotSignal, snapshot: Snapshot) {
    super('interrupted', context)
    this.signal = signal
    this.snapshot = snapshot
  }

  /**
   * Gets the output data (always null for interrupted results).
   *
   * @returns Always null since interrupted executions don't produce final output
   */
  public get output(): null {
    return null
  }
}
