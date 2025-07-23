export { Tool } from './tool.js'
export { Exit, ExitResult } from './exit.js'
export { ObjectInstance } from './objects.js'
export { SnapshotSignal, ThinkSignal, LoopExceededError } from './errors.js'

export {
  Component,
  RenderedComponent,
  LeafComponentDefinition,
  ContainerComponentDefinition,
  DefaultComponentDefinition,
  ComponentDefinition,
  assertValidComponent,
  isComponent,
  isAnyComponent,
  renderToTsx,
} from './component.js'

export { Citation, CitationsManager } from './citations.js'
export { DefaultComponents } from './component.default.js'
export { Snapshot } from './snapshots.js'
export { Chat, type MessageHandler } from './chat.js'

import { type ExecutionProps } from './llmz.js'
import { ExecutionResult } from './result.js'
import { wrapContent } from './truncator.js'
import { toValidFunctionName, toValidObjectName } from './utils.js'
export { Transcript } from './transcript.js'
export { ErrorExecutionResult, ExecutionResult, PartialExecutionResult, SuccessExecutionResult } from './result.js'
export { type Trace, type Traces } from './types.js'
export { type Iteration, ListenExit, ThinkExit, DefaultExit, IterationStatuses, IterationStatus } from './context.js'
export { type Context } from './context.js'
export type { LLMzPrompts } from './prompts/prompt.js'
export { type ValueOrGetter, getValue } from './getter.js'

export const utils = {
  toValidObjectName,
  toValidFunctionName,
  wrapContent,
}

/**
 * Executes an LLMz agent in either Chat Mode or Worker Mode.
 *
 * LLMz is a code-first AI agent framework that generates and runs TypeScript code
 * in a sandbox rather than using traditional JSON tool calling. This enables complex
 * logic, multi-tool orchestration, and native LLM thinking via comments and code structure.
 *
 * @param props - Configuration object for the execution
 * @param props.client - Botpress Client or Cognitive Client instance for LLM generation
 * @param props.instructions - System prompt/instructions for the LLM (static string or dynamic function)
 * @param props.chat - Optional Chat instance to enable Chat Mode with user interaction
 * @param props.tools - Array of Tool instances available to the agent (static or dynamic)
 * @param props.objects - Array of ObjectInstance for namespaced tools and variables (static or dynamic)
 * @param props.exits - Array of Exit definitions for structured completion (static or dynamic)
 * @param props.snapshot - Optional Snapshot to resume paused execution
 * @param props.signal - Optional AbortSignal to cancel execution
 * @param props.options - Optional execution options (loop limit, temperature, model, timeout)
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
 *   instructions: (ctx) => `Process ${ctx.variables.dataCount} records`,
 *   tools: async (ctx) => await getContextualTools(ctx),
 *   options: { loop: 10, temperature: 0.1 },
 *   onTrace: ({ trace, iteration }) => console.log(trace),
 *   onExit: async (result) => await validateResult(result)
 * })
 */
export const execute = async (props: ExecutionProps) => {
  // Code splitting to improve import performance
  const { executeContext } = await import('./llmz.js')
  return executeContext(props) as Promise<ExecutionResult>
}

/**
 * Loads the necessary dependencies for the library to work
 * Calling this function is optional, but it will improve the performance of the first call to `executeContext`
 * It's recommended to call this function at the beginning of your application without awaiting it (void init())
 */
export const init = async () => {
  await import('./llmz.js')
  await import('./component.js')
  await import('./tool.js')
  await import('./exit.js')
  await import('./jsx.js')
  await import('./vm.js')
  await import('./utils.js')
  await import('./truncator.js')
  await import('./typings.js')
  await import('./prompts/dual-modes.js')
}
