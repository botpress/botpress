import { ulid } from 'ulid'

import type { ComponentRegistry, RenderedComponent } from '../chat/component.js'
import type { Iteration } from '../context.js'
import {
  ExitInputError,
  HostOperationError,
  ThinkSignal,
  UnknownComponentError,
  UnknownExitError,
  isCriticalError,
  type LLMzFailure,
} from '../errors.js'

import type { Exit } from '../exit.js'
import { parseSchemaSync } from '../schema.js'
import { cloneMemoryValue } from '../session/memory.js'
import { schemaToTypeScript } from '../typings.js'
import { withMissingMember } from '../vm/member-proxy.js'
import type { ForcedInspection } from './forced-inspection.js'

/** A child message keeps its identity from preparation through acknowledged delivery. */
export type PreparedMessage = {
  id: string
  component: RenderedComponent
}

export type JavaScriptOutcome = { type: 'inspect'; value: unknown } | { type: 'exit'; exit: Exit; value: unknown }

type DecisionReceipt = Readonly<{ __llmz_decision: string }>

type TerminalOutcome = Extract<JavaScriptOutcome, { type: 'exit' }>

export type JavaScriptBindings = {
  exit(name?: string, value?: unknown): never
  inspect(value: unknown): DecisionReceipt
  chat: Readonly<Record<string, (input: unknown) => void>>
}

export type JavaScriptApi = {
  bindings: JavaScriptBindings
  resolve(value: unknown): JavaScriptOutcome | undefined
  isReceipt(value: unknown): boolean
  getTerminalOutcome(): TerminalOutcome | undefined
  /** The first host interruption closes execution before guest handlers can consume it. */
  getInterruption(): ThinkSignal | undefined
  requestInspection(inspection: ForcedInspection): void
  getForcedInspections(): readonly ForcedInspection[]
  throwIfTerminated(): void
  track<T>(operation: () => Promise<T>): Promise<T>
  assertOpen(): void
  /** Record validation failures and close host operations on critical configuration errors. */
  reportError(error: unknown): void
  /** Called at program settlement, before background work can invoke another host operation. */
  complete(): void
  /** Joins automatic message delivery and business work before the iteration can settle. */
  close(): Promise<void>
}

type JavaScriptApiOptions = {
  iteration: Pick<Iteration, 'id' | 'nativeCallId'>
  components: ComponentRegistry
  exits: readonly Exit[]
  deliver(messages: readonly PreparedMessage[]): Promise<void>
  signal?: AbortSignal
  onError?(error: unknown): void
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Component methods send synchronously; the runtime joins delivery in close().
 * Inspection returns a decision, while exit latches an outcome and stops the program.
 */
export function createJavaScriptApi({
  iteration,
  components,
  exits,
  deliver,
  signal,
  onError,
}: JavaScriptApiOptions): JavaScriptApi {
  const decisions = new Map<string, JavaScriptOutcome>()
  const pending = new Set<Promise<unknown>>()
  const inspections: ForcedInspection[] = []
  let open = true
  let outstanding: Promise<unknown>[] = []
  let delivery: Promise<void> | undefined
  let nextMessage = 0
  let terminalOutcome: TerminalOutcome | undefined
  let interruption: ThinkSignal | undefined
  let criticalFailure: LLMzFailure | undefined
  const termination = new Error('JavaScript execution terminated.')

  const reportError = (error: unknown): void => {
    onError?.(error)
    if (isCriticalError(error)) {
      criticalFailure = error
      complete()
    }
  }

  const throwIfTerminated = (): void => {
    if (criticalFailure) {
      throw criticalFailure
    }

    if (interruption || terminalOutcome) {
      throw termination
    }
  }

  const assertOpen = (): void => {
    throwIfTerminated()

    if (!open) {
      throw new HostOperationError('JavaScript has completed. Host operations and Object writes are closed.')
    }

    signal?.throwIfAborted()
  }

  const resolve = (value: unknown): JavaScriptOutcome | undefined => {
    if (!isRecord(value) || typeof value.__llmz_decision !== 'string') {
      return undefined
    }

    return decisions.get(value.__llmz_decision)
  }

  const issue = (outcome: JavaScriptOutcome): DecisionReceipt => {
    assertOpen()
    const token = ulid()
    decisions.set(token, outcome)

    return Object.freeze({ __llmz_decision: token })
  }

  const validateExit = (name = 'listen', value?: unknown): TerminalOutcome => {
    assertOpen()
    const registered = exits.find((candidate) => candidate.name === name || candidate.aliases.includes(name))
    if (!registered) {
      throw new UnknownExitError(
        name,
        exits.map((exit) => exit.name)
      )
    }

    if (!registered.schema && value !== undefined) {
      throw new ExitInputError(registered.name, [{ path: [], message: 'This exit takes no payload.' }], 'undefined')
    }

    const schema = registered.zSchema
    const parsed = schema ? parseSchemaSync(schema, value, `Exit "${registered.name}"`) : undefined
    if (parsed && !parsed.success) {
      throw new ExitInputError(registered.name, parsed.error.issues, schemaToTypeScript(schema!))
    }

    const validated = parsed?.data

    return {
      type: 'exit',
      exit: registered,
      value: cloneMemoryValue(validated),
    }
  }

  const exit = (name = 'listen', value?: unknown): never => {
    let outcome: TerminalOutcome
    try {
      outcome = validateExit(name, value)
    } catch (error) {
      reportError(error)
      throw error
    }

    terminalOutcome = outcome
    complete()

    throw termination
  }

  const track = <T>(operation: () => Promise<T>): Promise<T> => {
    assertOpen()
    const task = (async () => operation())()
    const tracked = task.then(
      (value) => {
        pending.delete(tracked)
        return value
      },
      (error) => {
        pending.delete(tracked)

        if (isCriticalError(error)) {
          criticalFailure = error
          complete()
        }

        if (!interruption && ThinkSignal.is(error)) {
          interruption = error
          complete()
        }

        throw error
      }
    )
    pending.add(tracked)

    // A discarded promise must not escape as an unhandled host rejection.
    void tracked.catch(() => {})

    return tracked
  }

  const enqueue = (messages: PreparedMessage[]): Promise<void> => {
    const dispatch = async () => deliver(messages)

    // Start the first delivery now, then preserve call order for asynchronous handlers.
    delivery = delivery ? delivery.then(dispatch) : dispatch()

    // Delivery failures are surfaced by close(), even if JavaScript is still running.
    void delivery.catch(() => {})

    return delivery
  }

  const complete = (): void => {
    if (!open) {
      return
    }

    open = false
    outstanding = [...pending]
  }

  const close = async (): Promise<void> => {
    complete()
    const [, delivered] = await Promise.all([
      Promise.allSettled(outstanding),
      Promise.allSettled(delivery ? [delivery] : []),
    ])

    if (criticalFailure) {
      throw criticalFailure
    }

    if (delivered[0]?.status === 'rejected') {
      throw delivered[0].reason
    }

    if (outstanding.length && !interruption) {
      throw new HostOperationError(
        `JavaScript completed with ${outstanding.length} unawaited host operation(s). Await all business tools before returning. Started operations have settled and may have completed effects; do not replay them.`
      )
    }
  }

  const inspect = (value: unknown): DecisionReceipt => issue({ type: 'inspect', value: cloneMemoryValue(value) })
  const chat = withMissingMember(
    Object.fromEntries(
      [...components].map(([name, component]) => [
        name,
        Object.freeze((input: unknown): void => {
          assertOpen()
          let rendered: RenderedComponent
          try {
            rendered = component.render(input)
          } catch (error) {
            reportError(error)
            throw error
          }

          void enqueue([
            {
              id: `${iteration.nativeCallId ?? iteration.id}:message:${++nextMessage}`,
              component: rendered,
            },
          ])
        }),
      ])
    ),
    (name) => {
      const error = new UnknownComponentError(name, [...components.keys()])
      onError?.(error)
      throw error
    }
  )
  const bindings: JavaScriptBindings = Object.freeze({
    exit: Object.freeze(exit),
    inspect: Object.freeze(inspect),
    chat: Object.freeze(chat),
  })

  return {
    bindings,
    resolve,
    isReceipt: (value) => resolve(value) !== undefined,
    getTerminalOutcome: () => terminalOutcome,
    getInterruption: () => interruption,
    requestInspection: (inspection) => {
      inspections.push(inspection)
    },
    getForcedInspections: () => inspections,
    throwIfTerminated,
    track,
    assertOpen,
    reportError,
    complete,
    close,
  }
}
