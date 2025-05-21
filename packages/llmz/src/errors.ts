import { JSONSchema } from '@bpinternal/zui'

import { type Assignment } from './compiler/plugins/track-tool-calls.js'
import { cleanStackTrace } from './stack-traces.js'

type ErrorConstructor = new (...args: any[]) => Error

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

  /**
   * Contains all the declared and executed variables during the VM execution
   * See file plugins/variable-extraction.ts for more details
   */
  public variables: { [key: string]: any } = {}

  constructor(public message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

//////////////////////////////////////////////////////////
// Interruption Signals
//////////////////////////////////////////////////////////

/** Interrupt means LLMz will provide a snapshot and pause execution until it is resumed */
export class VMInterruptSignal extends VMSignal {
  public toolCall?: {
    name: string
    inputSchema?: JSONSchema
    outputSchema?: JSONSchema
    input?: any
    assignment?: Assignment
  }

  constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class ExecuteSignal extends VMInterruptSignal {
  constructor() {
    super('Execute Signal received')
    this.message = Signals.serializeError(this)
  }
}

//////////////////////////////////////////////////////////
// Loop Signals
//////////////////////////////////////////////////////////

/** Loop means LLMz will continue the execution (unless it exhausted its iterations) */
export class VMLoopSignal extends VMSignal {
  constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class ThinkSignal extends VMLoopSignal {
  constructor(
    public reason: string,
    public context?: any
  ) {
    super('Think signal received: ' + reason)
    this.message = Signals.serializeError(this)
  }
  toString() {
    return Signals.serializeError(this)
  }
}

//////////////////////////////////////////////////////////
// Errors
//////////////////////////////////////////////////////////

export class CodeExecutionError extends Error {
  constructor(
    message: string,
    public code: string,
    public stacktrace: string
  ) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class InvalidCodeError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

export class LoopExceededError extends Error {
  constructor() {
    super('Loop exceeded error')
    this.message = Signals.serializeError(this)
  }
}

export class CodeFormattingError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message, {
      cause: 'Code formatting error',
    })
  }
}

export class SkillExecutionError extends Error {
  constructor(message?: string) {
    super(message ?? 'Error occurred while executing a skill')
    // DO NOT serialize this error, it's not meant to be serialized in the sandbox. This is a normal error, not a signal.
  }
}

export class AssignmentError extends Error {
  constructor(message: string) {
    super(message)
    this.message = Signals.serializeError(this)
  }
}

registerErrorClass('VMSignal', VMSignal)
registerErrorClass('VMInterruptSignal', VMInterruptSignal)
registerErrorClass('ExecuteSignal', ExecuteSignal)
registerErrorClass('VMLoopSignal', VMLoopSignal)
registerErrorClass('ThinkSignal', ThinkSignal)
registerErrorClass('CodeExecutionError', CodeExecutionError)
registerErrorClass('AssignmentError', AssignmentError)
