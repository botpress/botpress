import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { describeError, Signals } from '../errors.js'
import * as errors from './catalog.js'

const samples = {
  EXECUTION_FAILED: new errors.CodeExecutionError('Code failed', 'throw new Error()', 'line 1', 'Error'),
  INVALID_CODE: new errors.InvalidCodeError('Invalid JavaScript', 'const ='),
  CODE_FORMATTING_FAILED: new errors.CodeFormattingError('Invalid type', '{'),
  INVALID_TOOL_INPUT: new errors.ToolInputError(
    'lookup',
    [{ path: ['id'], message: 'Expected string' }],
    '{ id: string }'
  ),
  INVALID_EXIT_INPUT: new errors.ExitInputError('done', [], '{ ok: boolean }'),
  INVALID_OBJECT_PROPERTY: new errors.ObjectPropertyError('account', 'age', [], 'number'),
  INVALID_COMPONENT_INPUT: new errors.ComponentInputError('card', [], '{ title: string }'),
  UNKNOWN_TOOL: new errors.UnknownToolError('lookup', ['search']),
  UNKNOWN_EXIT: new errors.UnknownExitError('missing', ['done']),
  UNKNOWN_COMPONENT: new errors.UnknownComponentError('missing', ['card']),
  RESERVED_IDENTIFIER: new errors.ReservedIdentifierError('chat', 'variable'),
  TOOL_EXECUTION_FAILED: new errors.ToolExecutionError('lookup', new Error('Offline')),
  ITERATION_LIMIT: new errors.LoopExceededError(3),
  TOKEN_OVERFLOW: new errors.TokenOverflowError('Too large', 200, 100),
  MEMORY_CAPACITY: new errors.MemoryCapacityError(100),
  INVALID_ASSIGNMENT: new errors.AssignmentError('Read only'),
  GENERATION_FAILED: new errors.CognitiveError('Offline'),
  COMPACTION_FAILED: new errors.CompactionError('No summary'),
  INVALID_TOOL: new errors.InvalidToolError('Invalid tool'),
  INVALID_OBJECT: new errors.InvalidObjectError('Invalid object'),
  INVALID_EXIT: new errors.InvalidExitError('Invalid exit'),
  INVALID_COMPONENT: new errors.InvalidComponentError('Invalid component'),
  INVALID_CONFIG: new errors.InvalidConfigurationError('Invalid settings'),
  INVALID_MESSAGE: new errors.InvalidMessageError('Invalid message'),
  INVALID_EVENT: new errors.InvalidEventError('Invalid event'),
  INVALID_SESSION: new errors.InvalidSessionError('Invalid state'),
  SESSION_STATE: new errors.SessionStateError('Busy'),
  INVALID_MEMORY_VALUE: new errors.MemoryValueError('Function cannot be retained'),
  INVALID_NATIVE_CALL: new errors.NativeProtocolError('Invalid native call'),
  HOST_OPERATION_FAILED: new errors.HostOperationError('Await the tool'),
  DELIVERY_FAILED: new errors.DeliveryError('Channel offline'),
  MISSING_CHAT_RESPONSE: new errors.MissingChatResponseError('Send a response before listening.'),
  HOOK_FAILED: new errors.HookError('Use another value'),
  EXECUTION_ABORTED: new errors.ExecutionAbortedError('Cancelled'),
  INTERNAL_ERROR: new errors.InternalError('Unexpected failure'),
} satisfies Record<errors.ErrorCode, errors.LLMzFailure>

describe('public error catalogue', () => {
  test.each(Object.entries(samples))(
    '%s has a stable code, a detached guard and survives VM serialization',
    (code, error) => {
      const ErrorClass = errors.errorClasses[error.name as keyof typeof errors.errorClasses]
      const guard = ErrorClass.is
      expect(guard(error)).toBe(true)
      expect(errors.isLLMzError(error)).toBe(true)
      expect(error.code).toBe(code)
      const restored = Signals.maybeDeserializeError(Signals.serializeError(error))
      expect(guard(restored)).toBe(true)
      expect(restored).toMatchObject(error)
      expect(restored.message).toBe(error.message)
      expect(restored.critical).toBe(error.critical)
      expect(describeError(restored)).toMatchObject({ code, name: error.name, message: error.message })
    }
  )

  test('guards recognize a second independently loaded copy, including criticality', async () => {
    vi.resetModules()
    const other = await import('./catalog.js')
    const error = new other.ToolInputError('lookup', [], '{ id: string }')
    expect(error instanceof errors.ToolInputError).toBe(false)
    expect(errors.ToolInputError.is(error)).toBe(true)
    expect(errors.isLLMzError(error, 'INVALID_TOOL_INPUT')).toBe(true)
    expect(errors.ExitInputError.is(error)).toBe(false)
    expect(errors.isCriticalError(new other.CognitiveError('Offline'))).toBe(true)
    const wrapper = new errors.CodeExecutionError('Failure', '', '', undefined, new other.CompactionError('No summary'))
    expect(errors.isCriticalError(wrapper)).toBe(true)
  })

  test('guards narrow details by class or code and can be passed directly to filter', () => {
    const value: unknown = samples.INVALID_TOOL_INPUT
    if (errors.ToolInputError.is(value)) {
      expectTypeOf(value).toEqualTypeOf<errors.ToolInputError>()
      expect(value.expectedInput).toBe('{ id: string }')
    }

    if (errors.isLLMzError(value, 'INVALID_TOOL_INPUT')) {
      expectTypeOf(value).toEqualTypeOf<errors.ToolInputError>()
    }

    const found = Object.values(samples).filter(errors.ToolInputError.is)
    expectTypeOf(found).toEqualTypeOf<errors.ToolInputError[]>()
    expect(found).toEqual([value])
  })

  test.each([
    null,
    undefined,
    'INVALID_TOOL_INPUT',
    new Error('Invalid input'),
    { name: 'ToolInputError', code: 'INVALID_TOOL_INPUT', message: 'Lookalike', critical: false },
    new Proxy(
      {},
      {
        get() {
          throw new Error('Do not inspect')
        },
      }
    ),
  ])('guards reject unrelated or hostile values without throwing', (value) => {
    expect(errors.isLLMzError(value)).toBe(false)
    expect(errors.ToolInputError.is(value)).toBe(false)
    expect(errors.isCriticalError(value)).toBe(false)
  })

  test('nested causes retain their type and cycles cannot break diagnostic serialization', () => {
    const cause = samples.INVALID_TOOL_INPUT
    const error = new errors.CodeExecutionError(cause.message, 'lookup(42)', 'line 1', cause.name, cause)
    cause.cause = error
    try {
      const restored = Signals.maybeDeserializeError(Signals.serializeError(error))
      expect(errors.ToolInputError.is(restored.cause)).toBe(true)
      expect(() => JSON.stringify(describeError(error))).not.toThrow()
    } finally {
      delete cause.cause
    }
  })
})

test('diagnostics preserve thrown primitive causes and tolerate cyclic provider metadata', () => {
  const primitive = new errors.ToolExecutionError('lookup', 'Offline')
  const restored = Signals.maybeDeserializeError(Signals.serializeError(primitive))
  expect(errors.ToolExecutionError.is(restored)).toBe(true)
  expect(restored.cause).toBe('Offline')
  const cause = new Error('Provider failed')
  const metadata: Record<string, unknown> = { count: 1n }
  metadata.self = metadata
  Object.assign(cause, { metadata })
  const wrapper = new errors.CognitiveError(cause.message, { cause })
  expect(() => JSON.stringify(describeError(wrapper))).not.toThrow()
  expect(() => Signals.serializeError(wrapper)).not.toThrow()
})

test('empty error messages and absent optional details survive restoration', () => {
  const error = new errors.CodeExecutionError('', '', '')
  const restored = Signals.maybeDeserializeError(Signals.serializeError(error))
  expect(errors.CodeExecutionError.is(restored)).toBe(true)
  expect(restored.message).toBe('')
  expect(restored.originalErrorName).toBeUndefined()
})
