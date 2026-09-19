import { ulid } from 'ulid'

import type { Component, RenderedComponent } from '../component.js'
import type { Iteration } from '../context.js'
import { SnapshotSignal, ThinkSignal } from '../errors.js'
import type { Exit } from '../exit.js'
import { cloneMemoryValue } from '../memory.js'
import { validateNativePresentations, type NativePresentationInput } from './native-tools.js'

/** A child message keeps its identity from preparation through acknowledged delivery. */
export type PreparedMessage = {
  id: string
  component: RenderedComponent
}

export type JavaScriptOutcome =
  | { type: 'inspect'; value: unknown }
  | { type: 'exit'; exit: Exit; value: unknown; messages: PreparedMessage[] }

type DecisionReceipt = Readonly<{ __llmz_decision: string }>

export type ExitTarget = {
  name: string
  payload?: unknown
}

type TerminalOutcome = Extract<JavaScriptOutcome, { type: 'exit' }>

export type JavaScriptBindings = {
  exit(name?: string, value?: unknown): never
  inspect(value: unknown): DecisionReceipt
  chat: Readonly<{
    present(input: { messages: NativePresentationInput[]; exit?: ExitTarget }): DecisionReceipt
    buttons(buttons: Record<string, unknown>[]): DecisionReceipt
    send(messages: NativePresentationInput | NativePresentationInput[]): Promise<void>
  }>
}

export type JavaScriptApi = {
  bindings: JavaScriptBindings
  resolve(value: unknown): JavaScriptOutcome | undefined
  isReceipt(value: unknown): boolean
  getTerminalOutcome(): TerminalOutcome | undefined
  /** The first host interruption closes execution before guest handlers can consume it. */
  getInterruption(): SnapshotSignal | ThinkSignal | undefined
  throwIfTerminated(): void
  track<T>(operation: () => Promise<T>): Promise<T>
  assertOpen(): void
  /** Called at program settlement, before background work can invoke another host operation. */
  complete(): void
  /** Joins started work; interrupted programs preserve their signal instead of an unawaited-work error. */
  close(): Promise<void>
}

type JavaScriptApiOptions = {
  iteration: Pick<Iteration, 'id' | 'nativeCallId'>
  components: readonly Component[]
  exits: readonly Exit[]
  deliver(messages: readonly PreparedMessage[]): Promise<void>
  signal?: AbortSignal
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Presentation and inspection construct returned decisions. Calling exit instead
 * latches a validated outcome and stops the program before terminal effects run.
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
  let nextMessage = 0
  let terminalOutcome: TerminalOutcome | undefined
  let interruption: SnapshotSignal | ThinkSignal | undefined
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

  const prepareMessages = (messages: unknown): PreparedMessage[] => {
    assertOpen()
    const rendered = validateNativePresentations(messages, components)

    return rendered.map((component) => ({
      id: `${iteration.nativeCallId ?? iteration.id}:message:${++nextMessage}`,
      component: cloneMemoryValue(component) as RenderedComponent,
    }))
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
      messages: [],
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

        if (!interruption && (error instanceof ThinkSignal || error instanceof SnapshotSignal)) {
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

  const present = (input: { messages: NativePresentationInput[]; exit?: ExitTarget }): DecisionReceipt => {
    assertOpen()
    if (!isRecord(input) || Object.keys(input).some((key) => key !== 'messages' && key !== 'exit')) {
      throw new Error('chat.present requires { messages, exit? }.')
    }

    if (
      input.exit !== undefined &&
      (!isRecord(input.exit) ||
        typeof input.exit.name !== 'string' ||
        Object.keys(input.exit).some((key) => key !== 'name' && key !== 'payload'))
    ) {
      throw new Error('chat.present requires { name, payload? } for its optional exit.')
    }

    const terminal = validateExit(input.exit?.name, input.exit?.payload)

    return issue({
      ...terminal,
      messages: prepareMessages(input.messages),
    })
  }

  const buttons = (props: Record<string, unknown>[]): DecisionReceipt => {
    assertOpen()
    if (!Array.isArray(props)) {
      throw new Error('chat.buttons requires an array of Button props.')
    }

    return present({
      messages: props.map((button) => ({ component: 'Button', props: button })),
    })
  }

  const send = (input: NativePresentationInput | NativePresentationInput[]): Promise<void> => {
    const messages = prepareMessages(Array.isArray(input) ? input : [input])

    return track(() => deliver(messages))
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
    await Promise.allSettled(outstanding)

    if (outstanding.length && !interruption) {
      throw new Error(
        `JavaScript completed with ${outstanding.length} unawaited host operation(s). Await all tools and chat.send calls before returning. Started operations have settled and may have completed effects; do not replay them.`
      )
    }
  }

  const inspect = (value: unknown): DecisionReceipt => issue({ type: 'inspect', value: cloneMemoryValue(value) })
  const bindings: JavaScriptBindings = Object.freeze({
    exit: Object.freeze(exit),
    inspect: Object.freeze(inspect),
    chat: Object.freeze({
      present: Object.freeze(present),
      buttons: Object.freeze(buttons),
      send: Object.freeze(send),
    }),
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
    complete,
    close,
  }
}
