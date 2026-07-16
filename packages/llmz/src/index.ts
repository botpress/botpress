// @ts-ignore
export { version } from '../package.json'

export { Tool } from './tool.js'
export { Exit, ExitResult } from './exit.js'
export { ObjectInstance } from './objects.js'
export { SnapshotSignal, ThinkSignal, LoopExceededError } from './errors.js'
export { parseExit, type ParsedExit } from './exit-parser.js'

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

import { generateCode } from './one-shot.js'
import { ExecutionResult } from './result.js'
import { type ExecutionProps } from './runtime/types.js'
import { truncateWrappedContent, wrapContent } from './truncator.js'
import { toValidFunctionName, toValidObjectName } from './utils.js'
export { Transcript } from './transcript.js'
export { ErrorExecutionResult, ExecutionResult, PartialExecutionResult, SuccessExecutionResult } from './result.js'
export { type Trace, type Traces } from './types.js'
export { type Iteration, ListenExit, ThinkExit, DefaultExit, IterationStatuses, IterationStatus } from './context.js'
export { Context } from './context.js'
export type { LLMzPrompts } from './prompts/prompt.js'
export { type ValueOrGetter, getValue } from './getter.js'

export * from './custom-client.js'

export const utils = {
  toValidObjectName,
  toValidFunctionName,
  wrapContent,
  truncateWrappedContent,
}

/**
 * Generates a single block of TypeScript code from the LLM for the given task,
 * without executing it.
 *
 * Unlike {@link execute}, this performs exactly one LLM call — it does not run the
 * generated code, invoke tools, or iterate. It uses the one-shot prompt, so the model
 * is instructed to produce complete, correct code on the first (and only) try.
 *
 * The generated code is validated (it must compile and only reference tools, objects
 * and variables that exist); if validation fails, the model is asked to fix it a few
 * times before giving up. The result is one of:
 * - `{ status: 'success', code }` — valid code was produced.
 * - `{ status: 'bailed', reason }` — the task cannot be accomplished correctly with the
 *   available tools (e.g. a required tool is missing, or a tool's output is too vague to
 *   use with confidence), so the model bailed instead of producing subpar code.
 * - `{ status: 'invalid', code, errors }` — code was produced but never passed validation
 *   within the retry budget.
 *
 * @param props - Generation inputs (a subset of {@link ExecutionProps}: client,
 *   instructions, tools, objects, exits, model settings, etc.).
 * @returns Promise<GenerateCodeResult> - The generated code, the bail reason, or the
 *   invalid code with its validation errors.
 *
 * @example
 * const result = await generate({
 *   client: cognitiveClient,
 *   instructions: 'Summarize the input',
 *   tools: [summarizeTool],
 * })
 *
 * if (result.status === 'success') {
 *   console.log('Generated code:', result.code)
 * } else if (result.status === 'bailed') {
 *   console.log('Could not generate code:', result.reason)
 * } else {
 *   console.log('Generated code was invalid:', result.errors)
 * }
 */
export const generate = generateCode

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
 * @param props.model - Optional model name (or array or models to use as fallback) (static or dynamic function)
 * @param props.temperature - Optional temperature value (static or dynamic function)
 * @param props.options - Optional execution options (loop limit, timeout)
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
 * Props for {@link executeWithCode}: all of {@link ExecutionProps} plus the initial
 * `code` to run.
 */
export type ExecuteWithCodeProps = ExecutionProps & {
  /** Pre-generated code to run as the first iteration instead of calling the LLM. */
  code: string
}

/**
 * Executes an LLMz agent starting from a pre-supplied block of `code`, falling back
 * to normal LLM-driven execution if that code fails.
 *
 * The provided `code` runs as the **first iteration** (no LLM call). If it completes
 * successfully — i.e. reaches a valid Exit (or a snapshot/listen) — the result is
 * returned immediately with zero LLM cost. If the code errors (throws, fails to
 * compile, or does not return a valid exit), execution continues exactly like
 * {@link execute}: the next iteration is generated by the LLM, which sees the failed
 * code and its error and attempts to fix it, looping until success or the loop limit.
 *
 * Notes:
 * - The seeded run counts as the first iteration against `options.loop` (default 3),
 *   so by default there are up to 2 LLM fallback attempts. Pass `options.loop = N + 1`
 *   for N fallback attempts.
 * - The `code` seed is ignored when resuming from a `snapshot`.
 *
 * @param props - Same configuration as {@link execute}, plus the initial `code`.
 * @returns Promise<ExecutionResult> - Same result type as {@link execute}.
 *
 * @example
 * const result = await executeWithCode({
 *   client: cognitiveClient,
 *   instructions: 'Summarize the input',
 *   tools: [summarizeTool],
 *   code: cachedCode, // e.g. from a previous run or oneShot.generateCode
 * })
 */
export const executeWithCode = async (props: ExecuteWithCodeProps) => {
  // Code splitting to improve import performance
  const { executeContext } = await import('./runtime/execute.js')
  return executeContext(props, { initialCode: props.code }) as Promise<ExecutionResult>
}

/**
 * Loads the necessary dependencies for the library to work
 * Calling this function is optional, but it will improve the performance of the first call to `executeContext`
 * It's recommended to call this function at the beginning of your application without awaiting it (void init())
 */
export const init = async () => {
  await import('./runtime/execute.js')
  await import('./component.js')
  await import('./tool.js')
  await import('./exit.js')
  await import('./jsx.js')
  await import('./vm/index.js')
  await import('./utils.js')
  await import('./truncator.js')
  await import('./typings.js')
  await import('./prompts/dual-modes.js')
}
