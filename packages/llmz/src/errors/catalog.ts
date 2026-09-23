const ERROR_BRAND = Symbol.for('llmz.error.v1')

/** Stable library failures. Control-flow signals (such as ThinkSignal) are not errors. */
export abstract class LLMzError<C extends string = string> extends Error {
  public abstract readonly code: C

  protected constructor(
    message: string,
    public readonly critical: boolean,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = new.target.name
  }

  /** Shared across independently loaded copies of the library. */
  public get [ERROR_BRAND](): true {
    return true
  }

  public static readonly is = (value: unknown): value is LLMzError => isLLMzError(value)
}

/** A schema validation issue, relative to the supplied argument or property. */
export type ValidationIssue = { path: (string | number)[]; message: string }
export type ToolInputIssue = ValidationIssue

function validationMessage(subject: string, issues: readonly ValidationIssue[], expectedInput: string): string {
  const details = issues.map((issue) => `- ${issue.path.join('.') || 'input'}: ${issue.message}`).join('\n')
  return `${subject} received invalid input:\n${details}\n\nExpected input (TypeScript):\n${expectedInput}`
}

export class CodeExecutionError extends LLMzError<'EXECUTION_FAILED'> {
  public static override readonly is = (value: unknown): value is CodeExecutionError =>
    isLLMzError(value, 'EXECUTION_FAILED')
  public readonly code = 'EXECUTION_FAILED'
  public constructor(
    message: string,
    public readonly source: string,
    public readonly stacktrace: string,
    public readonly originalErrorName?: string,
    cause?: Error
  ) {
    super(message, isCriticalError(cause), { cause })
  }
}

export class InvalidCodeError extends LLMzError<'INVALID_CODE'> {
  public static override readonly is = (value: unknown): value is InvalidCodeError => isLLMzError(value, 'INVALID_CODE')
  public readonly code = 'INVALID_CODE'
  public constructor(
    message: string,
    public readonly source: string,
    options?: ErrorOptions
  ) {
    super(message, false, options)
  }
}

export class CodeFormattingError extends LLMzError<'CODE_FORMATTING_FAILED'> {
  public static override readonly is = (value: unknown): value is CodeFormattingError =>
    isLLMzError(value, 'CODE_FORMATTING_FAILED')
  public readonly code = 'CODE_FORMATTING_FAILED'
  public constructor(
    message: string,
    public readonly source: string
  ) {
    super(message, true)
  }
}

export class ToolInputError extends LLMzError<'INVALID_TOOL_INPUT'> {
  public static override readonly is = (value: unknown): value is ToolInputError =>
    isLLMzError(value, 'INVALID_TOOL_INPUT')
  public readonly code = 'INVALID_TOOL_INPUT'
  public constructor(
    public readonly toolName: string,
    public readonly issues: ValidationIssue[],
    public readonly expectedInput: string
  ) {
    super(validationMessage(`Tool "${toolName}"`, issues, expectedInput), false)
  }
}

export class ExitInputError extends LLMzError<'INVALID_EXIT_INPUT'> {
  public static override readonly is = (value: unknown): value is ExitInputError =>
    isLLMzError(value, 'INVALID_EXIT_INPUT')
  public readonly code = 'INVALID_EXIT_INPUT'
  public constructor(
    public readonly exitName: string,
    public readonly issues: ValidationIssue[],
    public readonly expectedInput: string
  ) {
    super(validationMessage(`Exit "${exitName}"`, issues, expectedInput), false)
  }
}

export class ObjectPropertyError extends LLMzError<'INVALID_OBJECT_PROPERTY'> {
  public static override readonly is = (value: unknown): value is ObjectPropertyError =>
    isLLMzError(value, 'INVALID_OBJECT_PROPERTY')
  public readonly code = 'INVALID_OBJECT_PROPERTY'
  public constructor(
    public readonly objectName: string,
    public readonly propertyName: string,
    public readonly issues: ValidationIssue[],
    public readonly expectedInput: string
  ) {
    super(validationMessage(`Object property ${objectName}.${propertyName}`, issues, expectedInput), false)
  }
}

export class ComponentInputError extends LLMzError<'INVALID_COMPONENT_INPUT'> {
  public static override readonly is = (value: unknown): value is ComponentInputError =>
    isLLMzError(value, 'INVALID_COMPONENT_INPUT')
  public readonly code = 'INVALID_COMPONENT_INPUT'
  public constructor(
    public readonly componentName: string,
    public readonly issues: ValidationIssue[],
    public readonly expectedInput: string
  ) {
    super(validationMessage(`Component "${componentName}"`, issues, expectedInput), false)
  }
}

export class UnknownToolError extends LLMzError<'UNKNOWN_TOOL'> {
  public static override readonly is = (value: unknown): value is UnknownToolError => isLLMzError(value, 'UNKNOWN_TOOL')
  public readonly code = 'UNKNOWN_TOOL'
  public constructor(
    public readonly toolName: string,
    public readonly availableTools: readonly string[] = [],
    message?: string
  ) {
    super(message ?? `Tool "${toolName}" is not available. Use a documented tool from the JavaScript API.`, false)
  }
}

export class UnknownComponentError extends LLMzError<'UNKNOWN_COMPONENT'> {
  public static override readonly is = (value: unknown): value is UnknownComponentError =>
    isLLMzError(value, 'UNKNOWN_COMPONENT')
  public readonly code = 'UNKNOWN_COMPONENT'
  public constructor(
    public readonly componentName: string,
    public readonly availableComponents: readonly string[]
  ) {
    super(
      `Component "chat.${componentName}" is not available. Available components: ${availableComponents.map((name) => `chat.${name}`).join(', ') || '(none)'}. Use native assistant text for ordinary replies.`,
      false
    )
  }
}

export class UnknownExitError extends LLMzError<'UNKNOWN_EXIT'> {
  public static override readonly is = (value: unknown): value is UnknownExitError => isLLMzError(value, 'UNKNOWN_EXIT')
  public readonly code = 'UNKNOWN_EXIT'
  public constructor(
    public readonly exitName: string,
    public readonly availableExits: readonly string[]
  ) {
    super(
      `Exit "${exitName}" is not available. Use a registered exit name. Available exits: ${availableExits.join(', ')}.`,
      false
    )
  }
}

export class ReservedIdentifierError extends LLMzError<'RESERVED_IDENTIFIER'> {
  public static override readonly is = (value: unknown): value is ReservedIdentifierError =>
    isLLMzError(value, 'RESERVED_IDENTIFIER')
  public readonly code = 'RESERVED_IDENTIFIER'
  public constructor(
    public readonly identifier: string,
    public readonly kind: 'variable' | 'tool' | 'object' | 'exit' | 'component' | 'binding',
    critical = kind !== 'variable',
    message = `Runtime name "${identifier}" is reserved.`
  ) {
    super(message, critical)
  }
}

export class ToolExecutionError extends LLMzError<'TOOL_EXECUTION_FAILED'> {
  public static override readonly is = (value: unknown): value is ToolExecutionError =>
    isLLMzError(value, 'TOOL_EXECUTION_FAILED')
  public readonly code = 'TOOL_EXECUTION_FAILED'
  public constructor(
    public readonly toolName: string,
    cause: unknown
  ) {
    super(cause instanceof Error ? cause.message : String(cause), false, { cause })
  }
}

export class LoopExceededError extends LLMzError<'ITERATION_LIMIT'> {
  public static override readonly is = (value: unknown): value is LoopExceededError =>
    isLLMzError(value, 'ITERATION_LIMIT')
  public readonly code = 'ITERATION_LIMIT'
  public constructor(public readonly limit?: number) {
    super('Loop exceeded error', true)
  }
}

export class TokenOverflowError extends LLMzError<'TOKEN_OVERFLOW'> {
  public static override readonly is = (value: unknown): value is TokenOverflowError =>
    isLLMzError(value, 'TOKEN_OVERFLOW')
  public readonly code = 'TOKEN_OVERFLOW'
  public constructor(
    message: string,
    public readonly tokens?: number,
    public readonly limit?: number,
    public readonly phase: 'input' | 'output' = 'input'
  ) {
    super(message, true)
  }
}

export class MemoryCapacityError extends LLMzError<'MEMORY_CAPACITY'> {
  public static override readonly is = (value: unknown): value is MemoryCapacityError =>
    isLLMzError(value, 'MEMORY_CAPACITY')
  public readonly code = 'MEMORY_CAPACITY'
  public constructor(public readonly maxBytes: number) {
    super(`Memory limit exceeded (${maxBytes} bytes). Compact retained iterations before continuing.`, true)
  }
}

/** A generated program tried to change read-only runtime state. */
export class AssignmentError extends LLMzError<'INVALID_ASSIGNMENT'> {
  public static override readonly is = (value: unknown): value is AssignmentError =>
    isLLMzError(value, 'INVALID_ASSIGNMENT')
  public readonly code = 'INVALID_ASSIGNMENT'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** The provider failed, or returned an incomplete or malformed generation. */
export class CognitiveError extends LLMzError<'GENERATION_FAILED'> {
  public static override readonly is = (value: unknown): value is CognitiveError =>
    isLLMzError(value, 'GENERATION_FAILED')
  public readonly code = 'GENERATION_FAILED'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Summarization failed; canonical history is preserved. */
export class CompactionError extends LLMzError<'COMPACTION_FAILED'> {
  public static override readonly is = (value: unknown): value is CompactionError =>
    isLLMzError(value, 'COMPACTION_FAILED')
  public readonly code = 'COMPACTION_FAILED'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid tool definition. */
export class InvalidToolError extends LLMzError<'INVALID_TOOL'> {
  public static override readonly is = (value: unknown): value is InvalidToolError => isLLMzError(value, 'INVALID_TOOL')
  public readonly code = 'INVALID_TOOL'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid object definition. */
export class InvalidObjectError extends LLMzError<'INVALID_OBJECT'> {
  public static override readonly is = (value: unknown): value is InvalidObjectError =>
    isLLMzError(value, 'INVALID_OBJECT')
  public readonly code = 'INVALID_OBJECT'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid exit definition. */
export class InvalidExitError extends LLMzError<'INVALID_EXIT'> {
  public static override readonly is = (value: unknown): value is InvalidExitError => isLLMzError(value, 'INVALID_EXIT')
  public readonly code = 'INVALID_EXIT'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid chat component definition. */
export class InvalidComponentError extends LLMzError<'INVALID_COMPONENT'> {
  public static override readonly is = (value: unknown): value is InvalidComponentError =>
    isLLMzError(value, 'INVALID_COMPONENT')
  public readonly code = 'INVALID_COMPONENT'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid execution, chat, or library configuration. */
export class InvalidConfigurationError extends LLMzError<'INVALID_CONFIG'> {
  public static override readonly is = (value: unknown): value is InvalidConfigurationError =>
    isLLMzError(value, 'INVALID_CONFIG')
  public readonly code = 'INVALID_CONFIG'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid session input message. */
export class InvalidMessageError extends LLMzError<'INVALID_MESSAGE'> {
  public static override readonly is = (value: unknown): value is InvalidMessageError =>
    isLLMzError(value, 'INVALID_MESSAGE')
  public readonly code = 'INVALID_MESSAGE'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid external event name or payload. */
export class InvalidEventError extends LLMzError<'INVALID_EVENT'> {
  public static override readonly is = (value: unknown): value is InvalidEventError =>
    isLLMzError(value, 'INVALID_EVENT')
  public readonly code = 'INVALID_EVENT'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** Invalid persisted session or native history. */
export class InvalidSessionError extends LLMzError<'INVALID_SESSION'> {
  public static override readonly is = (value: unknown): value is InvalidSessionError =>
    isLLMzError(value, 'INVALID_SESSION')
  public readonly code = 'INVALID_SESSION'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** The operation is not allowed in the current session state. */
export class SessionStateError extends LLMzError<'SESSION_STATE'> {
  public static override readonly is = (value: unknown): value is SessionStateError =>
    isLLMzError(value, 'SESSION_STATE')
  public readonly code = 'SESSION_STATE'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** A value cannot be retained in session memory. */
export class MemoryValueError extends LLMzError<'INVALID_MEMORY_VALUE'> {
  public static override readonly is = (value: unknown): value is MemoryValueError =>
    isLLMzError(value, 'INVALID_MEMORY_VALUE')
  public readonly code = 'INVALID_MEMORY_VALUE'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** The model returned an invalid native tool call. */
export class NativeProtocolError extends LLMzError<'INVALID_NATIVE_CALL'> {
  public static override readonly is = (value: unknown): value is NativeProtocolError =>
    isLLMzError(value, 'INVALID_NATIVE_CALL')
  public readonly code = 'INVALID_NATIVE_CALL'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** Generated code used a closed or unawaited host operation. */
export class HostOperationError extends LLMzError<'HOST_OPERATION_FAILED'> {
  public static override readonly is = (value: unknown): value is HostOperationError =>
    isLLMzError(value, 'HOST_OPERATION_FAILED')
  public readonly code = 'HOST_OPERATION_FAILED'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** Chat tried to wait for the user without delivering any message. */
export class MissingChatResponseError extends LLMzError<'MISSING_CHAT_RESPONSE'> {
  public static override readonly is = (value: unknown): value is MissingChatResponseError =>
    isLLMzError(value, 'MISSING_CHAT_RESPONSE')
  public readonly code = 'MISSING_CHAT_RESPONSE'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** Message delivery failed; external delivery may have partially completed. */
export class DeliveryError extends LLMzError<'DELIVERY_FAILED'> {
  public static override readonly is = (value: unknown): value is DeliveryError => isLLMzError(value, 'DELIVERY_FAILED')
  public readonly code = 'DELIVERY_FAILED'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** An execution hook failed; its external effects may be incomplete. */
export class HookError extends LLMzError<'HOOK_FAILED'> {
  public static override readonly is = (value: unknown): value is HookError => isLLMzError(value, 'HOOK_FAILED')
  public readonly code = 'HOOK_FAILED'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, false, options)
  }
}

/** Execution was cancelled or timed out. */
export class ExecutionAbortedError extends LLMzError<'EXECUTION_ABORTED'> {
  public static override readonly is = (value: unknown): value is ExecutionAbortedError =>
    isLLMzError(value, 'EXECUTION_ABORTED')
  public readonly code = 'EXECUTION_ABORTED'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** An unexpected library failure; inspect cause for the original exception. */
export class InternalError extends LLMzError<'INTERNAL_ERROR'> {
  public static override readonly is = (value: unknown): value is InternalError => isLLMzError(value, 'INTERNAL_ERROR')
  public readonly code = 'INTERNAL_ERROR'
  public constructor(message: string, options?: ErrorOptions) {
    super(message, true, options)
  }
}

/** @internal Constructor registry for VM diagnostics. */
export const errorClasses = {
  CodeExecutionError,
  InvalidCodeError,
  CodeFormattingError,
  ToolInputError,
  ExitInputError,
  ObjectPropertyError,
  ComponentInputError,
  UnknownToolError,
  UnknownExitError,
  UnknownComponentError,
  ReservedIdentifierError,
  ToolExecutionError,
  LoopExceededError,
  TokenOverflowError,
  MemoryCapacityError,
  AssignmentError,
  CognitiveError,
  CompactionError,
  InvalidToolError,
  InvalidObjectError,
  InvalidExitError,
  InvalidComponentError,
  InvalidConfigurationError,
  InvalidMessageError,
  InvalidEventError,
  InvalidSessionError,
  SessionStateError,
  MemoryValueError,
  NativeProtocolError,
  HostOperationError,
  DeliveryError,
  MissingChatResponseError,
  HookError,
  ExecutionAbortedError,
  InternalError,
}

/** Discriminated union of every library error. */
export type LLMzFailure = InstanceType<(typeof errorClasses)[keyof typeof errorClasses]>
export type ErrorCode = LLMzFailure['code']

const ERROR_CODES: ReadonlySet<string> = new Set([
  'EXECUTION_FAILED',
  'INVALID_CODE',
  'CODE_FORMATTING_FAILED',
  'INVALID_TOOL_INPUT',
  'INVALID_EXIT_INPUT',
  'INVALID_OBJECT_PROPERTY',
  'INVALID_COMPONENT_INPUT',
  'UNKNOWN_TOOL',
  'UNKNOWN_COMPONENT',
  'UNKNOWN_EXIT',
  'RESERVED_IDENTIFIER',
  'TOOL_EXECUTION_FAILED',
  'ITERATION_LIMIT',
  'TOKEN_OVERFLOW',
  'MEMORY_CAPACITY',
  'INVALID_ASSIGNMENT',
  'GENERATION_FAILED',
  'COMPACTION_FAILED',
  'INVALID_TOOL',
  'INVALID_OBJECT',
  'INVALID_EXIT',
  'INVALID_COMPONENT',
  'INVALID_CONFIG',
  'INVALID_MESSAGE',
  'INVALID_EVENT',
  'INVALID_SESSION',
  'SESSION_STATE',
  'INVALID_MEMORY_VALUE',
  'INVALID_NATIVE_CALL',
  'HOST_OPERATION_FAILED',
  'DELIVERY_FAILED',
  'MISSING_CHAT_RESPONSE',
  'HOOK_FAILED',
  'EXECUTION_ABORTED',
  'INTERNAL_ERROR',
])

/** Test an unknown exception, optionally narrowing to a stable error code. */
export function isLLMzError<C extends ErrorCode>(error: unknown, code: C): error is Extract<LLMzFailure, { code: C }>
export function isLLMzError(error: unknown): error is LLMzFailure
export function isLLMzError(error: unknown, code?: ErrorCode): error is LLMzFailure {
  if (!error || typeof error !== 'object') {
    return false
  }

  try {
    const value = error as Record<PropertyKey, unknown>
    return (
      value[ERROR_BRAND] === true &&
      typeof value.message === 'string' &&
      typeof value.name === 'string' &&
      typeof value.critical === 'boolean' &&
      typeof value.code === 'string' &&
      ERROR_CODES.has(value.code) &&
      (code === undefined || value.code === code)
    )
  } catch {
    return false
  }
}

/** Critical errors end execution; they are never sent back to the model for retry. */
export function isCriticalError(error: unknown): error is LLMzFailure & { critical: true } {
  return isLLMzError(error) && error.critical
}
