import { JSONSchema7 } from 'json-schema'
import { type Assignment } from './compiler/plugins/track-tool-calls.js'
import { cleanStackTrace } from './stack-traces.js'

type ErrorConstructor = new (...args: any[]) => Error

export type ToolCall = {
  name: string
  inputSchema?: JSONSchema7
  outputSchema?: JSONSchema7
  input?: unknown
  assignment?: Assignment
}

const errorClasses: { [key: string]: ErrorConstructor } = {}
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

  export function serializeError(error: Error): string {
    if (isWrappedError(error)) {
      const msg = tryParseMessage(error.message)

      return JSON.stringify({
        ...(typeof msg === 'object' ? msg : { message: msg }),
        properties: { ...error },
      })
    }

    return JSON.stringify({
      name: error.constructor.name,
      message: error.message,
      stack: cleanStackTrace(error.stack ?? ''),
      properties: { ...error },
    })
  }

  export function maybeDeserializeError(error: unknown): any {
    const errorIsAlreadyDeserialized = error instanceof Error && error.name in errorClasses
    if (errorIsAlreadyDeserialized) {
      return error
    }
    const serializedError =
      error instanceof Error ? error.message : typeof error === 'string' ? error : (error?.toString() ?? '')

    try {
      const parsed = JSON.parse(serializedError)
      if (parsed && parsed.name && parsed.message) {
        const { name, message, properties = {} } = parsed
        const ErrorClass = errorClasses[name] || Error
        const errorInstance = new ErrorClass(message)

        errorInstance.message = message
        errorInstance.name = name
        errorInstance.stack = cleanStackTrace((error as Error)?.stack ?? '')

        Object.assign(errorInstance, properties)
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

export class VMSignal extends Error {
  /**
   * The code that was executed by the VM up to the point of the signal
   */
  public truncatedCode: string = ''

  /** The current tool call, if any */
  public toolCall?: ToolCall

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
// Interruption Signals
//////////////////////////////////////////////////////////

/** Request a snapshot from inside a tool call */
export class SnapshotSignal extends VMSignal {
  public constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

//////////////////////////////////////////////////////////
// Loop Signals
//////////////////////////////////////////////////////////

/** Loop means LLMz will continue the execution (unless it exhausted its iterations) */
export class VMLoopSignal extends VMSignal {
  public constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class ThinkSignal extends VMLoopSignal {
  public constructor(
    public reason: string,
    public context?: any
  ) {
    super('Think signal received: ' + reason)
    this.message = Signals.serializeError(this)
  }

  public toString() {
    return Signals.serializeError(this)
  }
}

//////////////////////////////////////////////////////////
// Errors
//////////////////////////////////////////////////////////

export class CodeExecutionError extends Error {
  public constructor(
    message: string,
    public code: string,
    public stacktrace: string
  ) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class InvalidCodeError extends Error {
  public constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class LoopExceededError extends Error {
  public constructor() {
    super('Loop exceeded error')
    this.message = Signals.serializeError(this)
  }
}

export class CodeFormattingError extends Error {
  public constructor(
    message: string,
    public code: string
  ) {
    super(message, {
      cause: 'Code formatting error',
    })
  }
}

export class AssignmentError extends Error {
  public constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

registerErrorClass('VMSignal', VMSignal)
registerErrorClass('SnapshotSignal', SnapshotSignal)
registerErrorClass('VMLoopSignal', VMLoopSignal)
registerErrorClass('ThinkSignal', ThinkSignal)
registerErrorClass('CodeExecutionError', CodeExecutionError)
registerErrorClass('AssignmentError', AssignmentError)
