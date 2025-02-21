import { JSONSchema, z } from '@bpinternal/zui'
import { ulid } from 'ulid'

import { Assignment } from './compiler/plugins/track-tool-calls.js'
import { Context } from './context.js'
import { ExecuteSignal, VMInterruptSignal } from './errors.js'
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

export type ResolveCallback = {
  type: 'resolve'
  success: true
  description: string
  schema?: JSONSchema
  assignment?: Assignment
}

export type RejectCallback = {
  type: 'reject'
  success: false
  description: string
  schema: undefined
}

type Callback = ResolveCallback | RejectCallback

/** A snapshot must be lightweight and serializable, as it will be persisted and resumed in another conversation turn and transit on the wire */
export type Snapshot = {
  id: string
  signalType: string
  variables: Variable[]
  callbacks: Callback[]
  stack: string
}

export type SnapshotResult<T extends Callback = Callback, R = unknown> = {
  snapshot: Snapshot
  callback: T
  result: R
}

export const isSubworkflowSnapshot = (snapshot: unknown): snapshot is Snapshot => {
  return (snapshot as Snapshot)?.signalType === ExecuteSignal.name
}

export const createSnapshot = (signal: VMInterruptSignal): Snapshot => {
  const variables = Object.entries(signal.variables).map(([name, value]) => {
    const type = extractType(value)
    const bytes = JSON.stringify(value || '').length
    const truncated = bytes > MAX_SNAPSHOT_SIZE_BYTES

    return truncated
      ? ({ name, type, bytes, truncated: true, preview: inspect(value, name) ?? 'N/A' } satisfies Variable)
      : ({ name, type, bytes, truncated: false, value } satisfies Variable)
  })

  const callbacks: Callback[] = []

  return {
    id: 'snapshot_' + ulid(),
    signalType: signal.constructor.name,
    variables,
    callbacks,
    stack: signal.truncatedCode,
  }
}

export const resolveContextSnapshot = ({
  snapshot,
  context,
  value,
}: {
  snapshot: Snapshot
  context: Context
  value: unknown
}): Context => {
  if (context.iterations.length > 0) {
    throw new Error(
      'Cannot restore a snapshot on a context that has already been executed, please create a new context'
    )
  }

  const resolve = snapshot.callbacks.find((callback) => callback.type === 'resolve')
  if (!resolve || resolve.type !== 'resolve') {
    throw new Error('Snapshot does not contain a resolve callback')
  }

  if (resolve.schema) {
    const result = z.fromJsonSchema(resolve.schema).safeParse(value)
    if (!result.success) {
      throw new Error(`Error resolving snapshot, value does not match schema: ${result.error.message}`)
    }
    value = result.data
  }

  // const injectedVariables: Record<string, unknown> = context.injectedVariables ?? {}

  // if (resolve.assignment) {
  //   try {
  //     const fn = new Function(resolve.assignment.evalFn)
  //     const assignmentValue = fn(value)
  //     Object.assign(injectedVariables, assignmentValue)
  //   } catch {}
  // }

  // context.partialExecutionMessages.push(
  //   context.version.getSnapshotResolvedMessage({
  //     result: {
  //       callback: resolve,
  //       result: value,
  //       snapshot,
  //     },
  //     injectedVariables,
  //   })
  // )

  // context.injectedVariables = {
  //   ...injectedVariables,
  //   // Inject the resolved value of the tool call into the proper variables
  // }

  context.appliedSnapshot = {
    snapshot,
    callback: resolve,
    result: value,
  }

  return context
}

export const rejectContextSnapshot = (
  {
    // context,
    // snapshot,
    // error,
  }: {
    // snapshot: Snapshot
    // context: Context
    // error: unknown
  }
) => {
  // if (context.partialExecutionMessages.length > 0) {
  //   throw new Error(
  //     'Cannot reject a snapshot on a context that has already been partially executed, please create a new context'
  //   )
  // }
  // if (context.iterations.length > 0) {
  //   throw new Error('Cannot reject a snapshot on a context that has already been executed, please create a new context')
  // }
  // const reject = snapshot.callbacks.find((callback) => callback.type === 'reject')
  // if (!reject || reject.type !== 'reject') {
  //   throw new Error('Snapshot does not contain a reject callback')
  // }
  // context.partialExecutionMessages.push(
  //   context.version.getSnapshotRejectedMessage({
  //     result: {
  //       callback: reject,
  //       snapshot,
  //       result: error,
  //     },
  //   })
  // )
  // context.appliedSnapshot = {
  //   snapshot,
  //   callback: reject,
  //   result: error,
  // }
  // return { ...context }
}
