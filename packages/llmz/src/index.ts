// @ts-ignore
export { version } from '../package.json'

export { ThinkSignal, type ErrorDetails } from './errors.js'
export {
  AssignmentError,
  CodeExecutionError,
  CodeFormattingError,
  CognitiveError,
  CompactionError,
  ComponentInputError,
  DeliveryError,
  ExecutionAbortedError,
  ExitInputError,
  HookError,
  HostOperationError,
  InternalError,
  InvalidCodeError,
  InvalidComponentError,
  InvalidConfigurationError,
  InvalidEventError,
  InvalidExitError,
  InvalidMessageError,
  InvalidObjectError,
  InvalidSessionError,
  InvalidToolError,
  isCriticalError,
  isLLMzError,
  LLMzError,
  LoopExceededError,
  MemoryCapacityError,
  MemoryValueError,
  NativeProtocolError,
  ObjectPropertyError,
  ReservedIdentifierError,
  SessionStateError,
  TokenOverflowError,
  ToolExecutionError,
  ToolInputError,
  UnknownComponentError,
  UnknownExitError,
  UnknownToolError,
  type ErrorCode,
  type LLMzFailure,
  type ToolInputIssue,
  type ValidationIssue,
} from './errors/catalog.js'
export { Exit, type ExitResult } from './exit.js'
export { inspect, type InspectOptions } from './inspect.js'
export {
  createInspector,
  type InspectEvent,
  type InspectionIdentity,
  type InspectionPurpose,
  type Inspector,
  type OnInspect,
} from './inspection.js'
export { ObjectInstance } from './objects.js'
export type { CompactionOptions, SummarizeOptions, SummaryRequest } from './session/compactor.js'
export {
  Memory,
  type MemoryProvenance,
  type MemoryReport,
  type MemoryValue,
  type ObjectPropertyMemory,
} from './session/memory.js'
export {
  Session,
  type SessionInput,
  type SessionIteration,
  type SessionIterationRecord,
  type SessionMessage,
  type SessionOptions,
} from './session/session.js'
export { Tool } from './tool.js'
export { truncate, type Truncated, type TruncatePreserve, type TruncationPolicy } from './truncate.js'

export {
  assertValidComponent,
  Component,
  isAnyComponent,
  isComponent,
  type ComponentDefinition,
  type ComponentHandler,
  type ComponentSchema,
  type RenderedComponent,
} from './chat/component.js'

export {
  Chat,
  type AssistantTextMessage,
  type ChatMessage,
  type MessageDelta,
  type MessageDeltaHandler,
  type MessageMetadata,
  type ResponseHandler,
} from './chat/chat.js'
export { CitationsManager, type Citation } from './chat/citations.js'
export { DefaultComponents } from './chat/component.default.js'
export type { Response, ResponsePreset } from './chat/response.js'
export {
  DefaultExit,
  ListenExit,
  type Context,
  type ContextTokens,
  type Iteration,
  type IterationStatus,
  type IterationStatuses,
  type TokenUsage,
} from './context.js'
export { getValue, type ValueOrGetter } from './getter.js'
export { ErrorExecutionResult, ExecutionResult, SuccessExecutionResult } from './result.js'
export type { ExecutionHooks, ExecutionProps } from './runtime/types.js'
export { type Transcript } from './session/transcript.js'
export { type Trace, type Traces } from './types.js'

import { ExecutionResult } from './result.js'
import { type ExecutionProps } from './runtime/types.js'
import { toValidFunctionName, toValidObjectName } from './utils.js'

export * from './custom-client.js'

// Runtime environment configuration — needed on platforms that ban runtime WASM
// compilation and code generation from strings (e.g. Cloudflare Workers / workerd)
export { configureQuickJS } from './quickjs-variant.js'
export { configureTokenizer } from './utils.js'

export const utils = {
  toValidObjectName,
  toValidFunctionName,
}

/**
 * Executes an LLMz agent in either Chat Mode or Worker Mode.
 *
 * LLMz generates and runs JavaScript in a sandbox through the native run_javascript
 * tool. Assistant text streams normally; JavaScript returns decisions to present
 * rich messages, inspect results, or complete through a typed exit.
 *
 * @param props - Configuration object for the execution
 * @param props.client - Botpress Client or Cognitive Client instance for LLM generation
 * @param props.instructions - System prompt/instructions for the LLM (static string or dynamic function)
 * @param props.chat - Optional Chat instance to enable Chat Mode with user interaction
 * @param props.tools - Array of Tool instances available to the agent (static or dynamic)
 * @param props.objects - Array of ObjectInstance for namespaced tools and variables (static or dynamic)
 * @param props.exits - Array of Exit definitions for structured completion (static or dynamic)
 * @param props.session - Conversation state; append input before execution and persist it between executions
 * @param props.signal - Optional AbortSignal to cancel execution
 * @param props.model - Optional model name (or array or models to use as fallback) (static or dynamic function)
 * @param props.temperature - Optional temperature value (static or dynamic function)
 * @param props.metadata - Optional metadata attached to cognitive usage records for each LLM call
 * @param props.options - Optional execution options (loop limit, timeout, maxTokens context cap)
 * @param props.onTrace - Optional non-blocking hook for monitoring traces during execution
 * @param props.onIterationEnd - Optional blocking hook called after each iteration
 * @param props.onExit - Optional blocking hook called when an exit is reached (can prevent exit)
 * @param props.onBeforeExecution - Optional blocking hook to modify code before VM execution
 * @param props.onBeforeTool - Optional blocking hook to modify tool inputs before execution
 * @param props.onAfterTool - Optional blocking hook to modify tool outputs after execution
 *
 * @returns Promise<ExecutionResult> - Result containing success/error/interrupted status with type-safe exit checking
 *
 * @example
 * // Worker Mode - Automated execution
 * const result = await execute({
 *   client: cognitiveClient,
 *   instructions: 'Calculate the sum of numbers 1 to 100',
 *   exits: [myExit]
 * })
 *
 * if (result.is(myExit)) {
 *   console.log('Result:', result.output)
 * }
 *
 * @example
 * // Chat Mode - Interactive conversation
 * const result = await execute({
 *   client: cognitiveClient,
 *   instructions: 'You are a helpful assistant',
 *   chat: myChatInstance,
 *   tools: [searchTool, calculatorTool]
 * })
 *
 * if (result.is(ListenExit)) {
 *   // Agent is waiting for user input
 * }
 *
 * @example
 * // With dynamic instructions and hooks
 * const result = await execute({
 *   client: cognitiveClient,
 *   instructions: (ctx) => `Process ${ctx.session.memory.variables.dataCount} records`,
 *   tools: async (ctx) => await getContextualTools(ctx),
 *   model: 'best',
 *   temperature: 0.1,
 *   options: { loop: 10 },
 *   onTrace: ({ trace, iteration }) => console.log(trace),
 *   onExit: async (result) => await validateResult(result)
 * })
 */
export const execute = async (props: ExecutionProps) => {
  // Code splitting to improve import performance
  const { executeContext } = await import('./runtime/execute.js')
  return executeContext(props) as Promise<ExecutionResult>
}

/**
 * Loads the necessary dependencies for the library to work
 * Calling this function is optional, but it will improve the performance of the first call to `executeContext`
 * It's recommended to call this function at the beginning of your application without awaiting it (void init())
 */
export const init = async () => {
  await import('./runtime/execute.js')
  await import('./chat/component.js')
  await import('./tool.js')
  await import('./exit.js')
  await import('./vm/index.js')
  await import('./utils.js')
  await import('./typings.js')
  await import('./prompts/native.js')
}
