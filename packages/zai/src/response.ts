import { Usage, ZaiContext } from './context'
import { EventEmitter } from './emitter'

/**
 * Event types emitted during operation execution.
 *
 * @property progress - Emitted periodically with usage statistics (tokens, cost, requests)
 * @property complete - Emitted when operation completes successfully with the result
 * @property error - Emitted when operation fails with the error
 */
export type ResponseEvents<TComplete = any> = {
  /** Emitted during execution with updated usage statistics */
  progress: Usage
  /** Emitted when the operation completes with the full result */
  complete: TComplete
  /** Emitted when the operation fails with an error */
  error: unknown
}

/**
 * Promise-like wrapper for Zai operations with observability and control.
 *
 * Response provides a dual-value system:
 * - **Simplified value**: When awaited directly, returns a simplified result (e.g., boolean for `check()`)
 * - **Full result**: Via `.result()` method, returns `{ output, usage, elapsed }`
 *
 * All Zai operations return a Response instance, allowing you to:
 * - Track progress and usage in real-time
 * - Abort operations
 * - Bind to external abort signals
 * - Get detailed cost and performance metrics
 *
 * @template T - The full output type
 * @template S - The simplified output type (defaults to T)
 *
 * @example Basic usage (simplified)
 * ```typescript
 * // Simplified result (boolean)
 * const isPositive = await zai.check(review, 'Is this positive?')
 * console.log(isPositive) // true or false
 * ```
 *
 * @example Full result with usage
 * ```typescript
 * const response = zai.check(review, 'Is this positive?')
 * const { output, usage, elapsed } = await response.result()
 *
 * console.log(output.value) // true/false
 * console.log(output.explanation) // "The review expresses satisfaction..."
 * console.log(usage.tokens.total) // 150
 * console.log(usage.cost.total) // 0.002
 * console.log(elapsed) // 1234 (ms)
 * ```
 *
 * @example Progress tracking
 * ```typescript
 * const response = zai.summarize(longDocument, { length: 500 })
 *
 * response.on('progress', (usage) => {
 *   console.log(`Progress: ${usage.requests.percentage * 100}%`)
 *   console.log(`Tokens: ${usage.tokens.total}`)
 *   console.log(`Cost: $${usage.cost.total}`)
 * })
 *
 * const summary = await response
 * ```
 *
 * @example Aborting operations
 * ```typescript
 * const response = zai.extract(hugeDocument, schema)
 *
 * // Abort after 5 seconds
 * setTimeout(() => response.abort('Timeout'), 5000)
 *
 * try {
 *   const result = await response
 * } catch (error) {
 *   console.log('Operation aborted:', error)
 * }
 * ```
 *
 * @example External abort signal
 * ```typescript
 * const controller = new AbortController()
 * const response = zai.answer(documents, question).bindSignal(controller.signal)
 *
 * // User clicks cancel button
 * cancelButton.onclick = () => controller.abort()
 *
 * const answer = await response
 * ```
 *
 * @example Error handling
 * ```typescript
 * const response = zai.extract(text, schema)
 *
 * response.on('error', (error) => {
 *   console.error('Operation failed:', error)
 * })
 *
 * try {
 *   const result = await response
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export class Response<T = any, S = T> implements PromiseLike<S> {
  private _promise: Promise<T>
  private _eventEmitter: EventEmitter<ResponseEvents<T>>
  private _context: ZaiContext
  private _elasped: number | null = null
  private _simplify: (value: T) => S

  public constructor(context: ZaiContext, promise: Promise<T>, simplify: (value: T) => S) {
    this._context = context
    this._eventEmitter = new EventEmitter<ResponseEvents<T>>()
    this._simplify = simplify
    this._promise = promise.then(
      (value) => {
        this._elasped ||= this._context.elapsedTime
        this._eventEmitter.emit('complete', value)
        this._eventEmitter.clear()
        this._context.clear()
        return value
      },
      (reason) => {
        this._elasped ||= this._context.elapsedTime
        this._eventEmitter.emit('error', reason)
        this._eventEmitter.clear()
        this._context.clear()
        throw reason
      }
    )

    this._context.on('update', (usage) => {
      this._eventEmitter.emit('progress', usage)
    })
  }

  /**
   * Subscribes to events emitted during operation execution.
   *
   * @param type - Event type: 'progress', 'complete', or 'error'
   * @param listener - Callback function to handle the event
   * @returns This Response instance for chaining
   *
   * @example Track progress
   * ```typescript
   * response.on('progress', (usage) => {
   *   console.log(`${usage.requests.percentage * 100}% complete`)
   *   console.log(`Cost: $${usage.cost.total}`)
   * })
   * ```
   *
   * @example Handle completion
   * ```typescript
   * response.on('complete', (result) => {
   *   console.log('Operation completed:', result)
   * })
   * ```
   *
   * @example Handle errors
   * ```typescript
   * response.on('error', (error) => {
   *   console.error('Operation failed:', error)
   * })
   * ```
   */
  public on<K extends keyof ResponseEvents<T>>(type: K, listener: (event: ResponseEvents<T>[K]) => void) {
    this._eventEmitter.on(type, listener)
    return this
  }

  /**
   * Unsubscribes from events.
   *
   * @param type - Event type to unsubscribe from
   * @param listener - The exact listener function to remove
   * @returns This Response instance for chaining
   *
   * @example
   * ```typescript
   * const progressHandler = (usage) => console.log(usage.tokens.total)
   * response.on('progress', progressHandler)
   * // Later...
   * response.off('progress', progressHandler)
   * ```
   */
  public off<K extends keyof ResponseEvents<T>>(type: K, listener: (event: ResponseEvents<T>[K]) => void) {
    this._eventEmitter.off(type, listener)
    return this
  }

  /**
   * Subscribes to an event for a single emission.
   *
   * The listener is automatically removed after being called once.
   *
   * @param type - Event type: 'progress', 'complete', or 'error'
   * @param listener - Callback function to handle the event once
   * @returns This Response instance for chaining
   *
   * @example
   * ```typescript
   * response.once('complete', (result) => {
   *   console.log('Finished:', result)
   * })
   * ```
   */
  public once<K extends keyof ResponseEvents<T>>(type: K, listener: (event: ResponseEvents<T>[K]) => void) {
    this._eventEmitter.once(type, listener)
    return this
  }

  /**
   * Binds an external AbortSignal to this operation.
   *
   * When the signal is aborted, the operation will be cancelled automatically.
   * Useful for integrating with UI cancel buttons or request timeouts.
   *
   * @param signal - AbortSignal to bind
   * @returns This Response instance for chaining
   *
   * @example With AbortController
   * ```typescript
   * const controller = new AbortController()
   * const response = zai.extract(data, schema).bindSignal(controller.signal)
   *
   * // Cancel from elsewhere
   * cancelButton.onclick = () => controller.abort()
   * ```
   *
   * @example With timeout
   * ```typescript
   * const controller = new AbortController()
   * setTimeout(() => controller.abort('Timeout'), 10000)
   *
   * const response = zai.answer(docs, question).bindSignal(controller.signal)
   * ```
   */
  public bindSignal(signal: AbortSignal): this {
    if (signal.aborted) {
      this.abort(signal.reason)
    }

    const signalAbort = () => {
      this.abort(signal.reason)
    }

    signal.addEventListener('abort', () => signalAbort())

    void this.once('complete', () => signal.removeEventListener('abort', signalAbort))
    void this.once('error', () => signal.removeEventListener('abort', signalAbort))

    return this
  }

  /**
   * Aborts the operation in progress.
   *
   * The operation will be cancelled and throw an abort error.
   * Any partial results will not be returned.
   *
   * @param reason - Optional reason for aborting (string or Error)
   *
   * @example
   * ```typescript
   * const response = zai.extract(largeDocument, schema)
   *
   * // Abort after 5 seconds
   * setTimeout(() => response.abort('Operation timeout'), 5000)
   *
   * try {
   *   await response
   * } catch (error) {
   *   console.log('Aborted:', error)
   * }
   * ```
   */
  public abort(reason?: string | Error) {
    this._context.controller.abort(reason)
  }

  /**
   * Promise interface - allows awaiting the Response.
   *
   * When awaited, returns the simplified value (S).
   * Use `.result()` for full output with usage statistics.
   *
   * @param onfulfilled - Success handler
   * @param onrejected - Error handler
   * @returns Promise resolving to simplified value
   *
   * @example
   * ```typescript
   * // Simplified value
   * const isPositive = await zai.check(review, 'Is positive?')
   * console.log(isPositive) // true
   * ```
   */
  // oxlint-disable-next-line no-thenable
  public then<TResult1 = S, TResult2 = never>(
    onfulfilled?: ((value: S) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this._promise.then(
      (value: T) => {
        const simplified = this._simplify(value)
        return onfulfilled ? onfulfilled(simplified) : simplified
      },
      (reason) => {
        if (onrejected) {
          return onrejected(reason)
        }
        throw reason
      }
    ) as PromiseLike<TResult1 | TResult2>
  }

  /**
   * Promise interface - handles errors.
   *
   * @param onrejected - Error handler
   * @returns Promise resolving to simplified value or error result
   */
  public catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): PromiseLike<S | TResult> {
    return this._promise.catch(onrejected) as PromiseLike<S | TResult>
  }

  /**
   * Gets the full result with detailed usage statistics and timing.
   *
   * Unlike awaiting the Response directly (which returns simplified value),
   * this method provides:
   * - `output`: Full operation result (not simplified)
   * - `usage`: Detailed token usage, cost, and request statistics
   * - `elapsed`: Operation duration in milliseconds
   *
   * @returns Promise resolving to full result object
   *
   * @example
   * ```typescript
   * const { output, usage, elapsed } = await zai.check(text, condition).result()
   *
   * console.log(output.value) // true/false
   * console.log(output.explanation) // "The text expresses..."
   * console.log(usage.tokens.total) // 245
   * console.log(usage.cost.total) // 0.0012
   * console.log(elapsed) // 1523 (ms)
   * ```
   *
   * @example Usage statistics breakdown
   * ```typescript
   * const { usage } = await response.result()
   *
   * console.log('Requests:', usage.requests.requests)
   * console.log('Cached:', usage.requests.cached)
   * console.log('Input tokens:', usage.tokens.input)
   * console.log('Output tokens:', usage.tokens.output)
   * console.log('Input cost:', usage.cost.input)
   * console.log('Output cost:', usage.cost.output)
   * console.log('Total cost:', usage.cost.total)
   * ```
   */
  public async result(): Promise<{
    output: T
    usage: Usage
    elapsed: number
  }> {
    const output = await this._promise
    const usage = this._context.usage
    return { output, usage, elapsed: this._elasped }
  }
}
