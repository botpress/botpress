import { errorClasses as failureClasses, isLLMzError } from './errors/catalog.js'
export * from './errors/catalog.js'

import { cleanStackTrace } from './stack-traces.js'

type ErrorConstructor = new (...args: any[]) => Error

const errorClasses: { [key: string]: ErrorConstructor } = { ...failureClasses }

/** JSON-safe diagnostic form of an exception; custom fields remain available. */
export type ErrorDetails = {
  name: string
  message: string
  stack?: string
  cause?: ErrorDetails
  [key: string]: unknown
}

/** @internal Serialize diagnostics without losing non-enumerable Error fields. */
export function describeError(error: Error, seen = new Set<Error>()): ErrorDetails {
  const value = Signals.maybeDeserializeError(error) as Error
  const details: ErrorDetails = {
    ...diagnosticProperties(value),
    name: value.name === 'Error' ? value.constructor.name : value.name,
    message: value.message,
    stack: value.stack,
  }
  delete details.cause
  seen.add(error)

  if (value.cause instanceof Error && !seen.has(value.cause)) {
    details.cause = describeError(value.cause, seen)
  } else if (value.cause !== undefined && !(value.cause instanceof Error)) {
    details.cause = { name: 'ThrownValue', message: String(value.cause), value: diagnosticValue(value.cause) }
  }

  return details
}
/** User-supplied exceptions can carry cycles, bigint metadata, or throwing accessors. */
function diagnosticValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined
  }

  const seen = new WeakSet<object>()
  try {
    const encoded = JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') {
        return item.toString()
      }

      if (item && typeof item === 'object') {
        if (seen.has(item)) {
          return '[Circular]'
        }

        seen.add(item)
      }

      return item
    })
    return encoded === undefined ? String(value) : JSON.parse(encoded)
  } catch {
    return '[Unserializable]'
  }
}

function diagnosticProperties(error: Error): Record<string, unknown> {
  const entries = Object.entries(Object.getOwnPropertyDescriptors(error))
    .filter(([key, descriptor]) => key !== 'cause' && descriptor.enumerable && 'value' in descriptor)
    .map(([key, descriptor]) => [key, diagnosticValue(descriptor.value)])
  return Object.fromEntries(entries)
}

function registerErrorClass(name: string, errorClass: ErrorConstructor) {
  errorClasses[name] = errorClass
}

const tryParseMessage = (str: string) => {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

export namespace Signals {
  export function isWrappedError(error: Error) {
    const isAlreadyWrapped = error.name === 'Error' && error?.message?.startsWith('{') && error?.message?.endsWith('}')
    return isAlreadyWrapped
  }

  export function serializeError(error: Error, seen = new Set<Error>()): string {
    seen.add(error)
    const properties = diagnosticProperties(error)
    if (error.cause instanceof Error && !seen.has(error.cause)) {
      Object.assign(properties, { cause: serializeError(error.cause, seen) })
    } else if (error.cause !== undefined && !(error.cause instanceof Error)) {
      properties.cause = { value: diagnosticValue(error.cause) }
    }

    if (isWrappedError(error)) {
      const msg = tryParseMessage(error.message)

      return JSON.stringify({
        ...(typeof msg === 'object' ? msg : { message: msg }),
        properties,
      })
    }

    return JSON.stringify({
      name: error.constructor.name,
      message: error.message,
      stack: cleanStackTrace(error.stack ?? ''),
      properties,
    })
  }

  export function maybeDeserializeError(error: unknown): any {
    const errorIsAlreadyDeserialized =
      isLLMzError(error) ||
      (error instanceof Error && !!errorClasses[error.name] && error instanceof errorClasses[error.name]!)
    if (errorIsAlreadyDeserialized) {
      return error
    }

    let serializedError = error?.toString() ?? ''
    if (error instanceof Error) {
      serializedError = error.message
    } else if (typeof error === 'string') {
      serializedError = error
    }

    try {
      const parsed = JSON.parse(serializedError)
      if (parsed && typeof parsed.name === 'string' && typeof parsed.message === 'string') {
        const { name, message, properties = {} } = parsed
        const ErrorClass =
          Object.values(failureClasses).find((candidate) =>
            candidate.is({
              ...properties,
              name,
              message,
              [Symbol.for('llmz.error.v1')]: true,
            })
          ) ?? (Object.hasOwn(errorClasses, name) ? errorClasses[name]! : Error)
        const errorInstance = Object.setPrototypeOf(new Error(message), ErrorClass.prototype) as Error

        errorInstance.message = message
        errorInstance.name = name
        errorInstance.stack = cleanStackTrace((error as Error)?.stack ?? '')

        Object.assign(errorInstance, properties)
        if (typeof properties.cause === 'string') {
          errorInstance.cause = maybeDeserializeError(properties.cause)
        } else if (properties.cause && typeof properties.cause === 'object' && 'value' in properties.cause) {
          errorInstance.cause = properties.cause.value
        }

        if (isWrappedError(errorInstance)) {
          return maybeDeserializeError(errorInstance)
        }

        return errorInstance
      }
    } catch {
      // If parsing fails, return the original input
    }

    return error
  }
}

const SIGNAL_BRAND = Symbol.for('llmz.signal.v1')

function isSignal(value: unknown): value is VMSignal {
  if (!value || typeof value !== 'object') {
    return false
  }

  try {
    return (value as VMSignal)[SIGNAL_BRAND] === true
  } catch {
    return false
  }
}

export class VMSignal extends Error {
  public get [SIGNAL_BRAND](): true {
    return true
  }
  public readonly signalKind: 'vm' | 'loop' | 'think' = 'vm'
  public static readonly is = (value: unknown): value is VMSignal => isSignal(value)

  /**
   * The code that was executed by the VM up to the point of the signal
   */
  public truncatedCode: string = ''

  /**
   * Contains all the declared and executed variables during the VM execution
   * See file plugins/variable-extraction.ts for more details
   */
  public variables: { [key: string]: any } = {}

  public constructor(public message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

//////////////////////////////////////////////////////////
// Loop Signals
//////////////////////////////////////////////////////////

/** Loop means LLMz will continue the execution (unless it exhausted its iterations) */
export class VMLoopSignal extends VMSignal {
  public override readonly signalKind: 'loop' | 'think' = 'loop'
  public static override readonly is = (value: unknown): value is VMLoopSignal =>
    isSignal(value) && (value.signalKind === 'loop' || value.signalKind === 'think')

  public constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class ThinkSignal extends VMLoopSignal {
  public override readonly signalKind = 'think'
  public static override readonly is = (value: unknown): value is ThinkSignal =>
    isSignal(value) && value.signalKind === 'think'

  public constructor(
    public reason: string,
    public context?: any,
    public metadata?: Record<string, unknown>
  ) {
    super('Think signal received: ' + reason)
    this.message = Signals.serializeError(this)
    this.stack = ''
  }

  public toString() {
    return Signals.serializeError(this)
  }
}

registerErrorClass('VMSignal', VMSignal)
registerErrorClass('VMLoopSignal', VMLoopSignal)
registerErrorClass('ThinkSignal', ThinkSignal)
