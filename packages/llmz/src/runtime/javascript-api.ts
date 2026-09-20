import { ulid } from 'ulid'

import type { MessageMetadata } from '../chat.js'
import {
  isAnyComponent,
  prepareComponentDelivery,
  type ComponentRegistry,
  type RenderedComponent,
} from '../component.js'
import type { Iteration } from '../context.js'
import { ThinkSignal } from '../errors.js'
import type { Exit } from '../exit.js'
import { cloneMemoryValue } from '../memory.js'

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
  throwIfTerminated(): void
  track<T>(operation: () => Promise<T>): Promise<T>
  assertOpen(): void
  /** Queue a component yielded by a host tool alongside ordinary chat sends. */
  sendComponent(value: unknown, metadata: MessageMetadata): Promise<void>
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
}: JavaScriptApiOptions): JavaScriptApi {
  const decisions = new Map<string, JavaScriptOutcome>()
  const pending = new Set<Promise<unknown>>()
  let open = true
  let outstanding: Promise<unknown>[] = []
  let delivery: Promise<void> | undefined
  let nextMessage = 0
  let terminalOutcome: TerminalOutcome | undefined
  let interruption: ThinkSignal | undefined
  const termination = new Error('JavaScript execution terminated.')

  const throwIfTerminated = (): void => {
    if (interruption || terminalOutcome) {
      throw termination
    }
  }

  const assertOpen = (): void => {
    throwIfTerminated()

    if (!open) {
      throw new Error('JavaScript has completed. Host operations and Object writes are closed.')
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
      throw new Error(`Exit "${name}" is not available. Use a registered exit name.`)
    }

    if (!registered.schema && value !== undefined) {
      throw new Error(`Exit "${registered.name}" takes no payload.`)
    }

    const validated = registered.zSchema ? registered.zSchema.parse(value) : undefined

    return {
      type: 'exit',
      exit: registered,
      value: cloneMemoryValue(validated),
    }
  }

  const exit = (name = 'listen', value?: unknown): never => {
    const outcome = validateExit(name, value)
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

        if (!interruption && error instanceof ThinkSignal) {
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

  const sendComponent = async (value: unknown, metadata: MessageMetadata): Promise<void> => {
    assertOpen()

    if (!isAnyComponent(value)) {
      throw new Error('Only registered rich components can be yielded by a tool.')
    }

    const component = components.get(value.name)

    if (!component) {
      throw new Error(`Component "${value.name}" is not registered.`)
    }

    const rendered = prepareComponentDelivery(component, value)

    await enqueue([{ id: metadata.id, component: cloneMemoryValue(rendered) as RenderedComponent }])
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

    if (delivered[0]?.status === 'rejected') {
      throw delivered[0].reason
    }

    if (outstanding.length && !interruption) {
      throw new Error(
        `JavaScript completed with ${outstanding.length} unawaited host operation(s). Await all business tools before returning. Started operations have settled and may have completed effects; do not replay them.`
      )
    }
  }

  const inspect = (value: unknown): DecisionReceipt => issue({ type: 'inspect', value: cloneMemoryValue(value) })
  const chat = Object.fromEntries(
    [...components].map(([name, component]) => [
      name,
      Object.freeze((input: unknown): void => {
        assertOpen()
        const rendered = component.render(input)

        void enqueue([
          {
            id: `${iteration.nativeCallId ?? iteration.id}:message:${++nextMessage}`,
            component: rendered,
          },
        ])
      }),
    ])
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
    throwIfTerminated,
    track,
    assertOpen,
    sendComponent,
    complete,
    close,
  }
}
