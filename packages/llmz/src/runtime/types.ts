import { Cognitive, type BotpressClientLike, Models, type SttModels } from '@botpress/cognitive'

import { Chat } from '../chat.js'
import { Context, Iteration } from '../context.js'
import { _CustomModelClient } from '../custom-client.js'
import { Exit, ExitResult } from '../exit.js'
import { ValueOrGetter } from '../getter.js'
import { type ObjectInstance } from '../objects.js'
import { Snapshot } from '../snapshots.js'
import { type Tool } from '../tool.js'
import { Trace } from '../types.js'

export type ExecutionHooks = {
  /**
   * NON-BLOCKING HOOK
   *   This hook will not block the execution of the iteration.
   * NON-MUTATION HOOK
   *   This hook can't mutate traces.
   *
   * This hook is called for each trace that is generated during the iteration.
   * It is useful for logging, debugging, or monitoring the execution of the iteration.
   * The abort controller can be used to stop the execution when a trace reveals
   * something that should halt it (e.g. a forbidden tool call).
   */
  onTrace?: (event: { trace: Trace; iteration: number; controller: AbortController }) => void

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   *
   * This hook will be called before each iteration starts, regardless of the status.
   * This is useful for logging or dynamically change model arguments
   */
  onIterationStart?: (
    iteration: Iteration,
    controller: AbortController,
    context: Context
  ) => Promise<void | Partial<Iteration>> | void | Partial<Iteration>

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * NON-MUTATION HOOK
   *   This hook can't mutate the result or status of the iteration.
   *
   * This hook will be called after each iteration ends, regardless of the status.
   * This is useful for logging, cleanup or to prevent or delay the next iteration from starting.
   */
  onIterationEnd?: (iteration: Iteration, controller: AbortController) => Promise<void> | void

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * NON-MUTATION HOOK
   *   This hook can't mutate the exit result.
   *
   * This hook is called when an exit is reached in the iteration.
   * It is useful for logging, sending notifications, or performing actions based on the exit.
   * It can also be used to throw an error and preventing the exit from being successful.
   * If this hook throws an error, the execution will keep iterating with the error as context.
   * The abort controller can be used to stop the execution entirely instead of iterating.
   */
  onExit?: <T = unknown>(result: ExitResult<T>, controller: AbortController) => Promise<void> | void

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * MUTATION HOOK
   *   This hook can mutate the code to run in the iteration.
   *
   * This hook is called after the LLM generates the code for the iteration, but before it is executed.
   * It is useful for modifying the code to run, or for guarding against certain code patterns.
   */
  onBeforeExecution?: (iteration: Iteration, controller: AbortController) => Promise<{ code?: string } | void>

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * MUTATION HOOK
   *   This hook can mutate the input to the tool.
   *
   * This hook is called before any tool is executed.
   * It is useful for modifying the input to a tool or prevent a tool from executing.
   */
  onBeforeTool?: (event: {
    iteration: Iteration
    tool: Tool
    input: any
    controller: AbortController
    toolCallId: string
    object?: string
  }) => Promise<{ input?: any } | void>

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * MUTATION HOOK
   *   This hook can mutate the output of the tool.
   *
   * This hook is called after a tool is executed.
   * It is useful for modifying the output of a tool or for logging purposes.
   */
  onAfterTool?: (event: {
    iteration: Iteration
    tool: Tool
    input: any
    output: any
    controller: AbortController
    toolCallId: string
    object?: string
  }) => Promise<{ output?: any } | void>
}

type Options = Partial<Pick<Context, 'loop' | 'timeout'>> & {
  /**
   * Optional cap on the model's context window, in tokens.
   * The effective limit is `min(maxTokens, model's max input tokens)`.
   * Useful to reduce cost and latency on models with very large context windows.
   */
  maxTokens?: number
  /**
   * Maximum time to wait for the first streamed token, in milliseconds, before
   * the cognitive service falls back to the next model/provider. Only applies
   * to streaming clients (CognitiveBeta / Cognitive v2), and works best when
   * `model` is an array of fallback models.
   */
  maxTimeToFirstToken?: number
  /**
   * STT model used to transcribe audio attachments (voice messages) when the
   * target LLM does not support audio natively. Audio-capable models receive
   * the raw audio and ignore this. Defaults to 'fast'.
   */
  transcriptionModel?: SttModels
}

export type ExecutionProps = {
  /**
   * If provided, the execution will be run in "Chat Mode".
   * In this mode, the execution will be able to send messages to the chat and will also have access to a chat transcript.
   * The execution can still end with a custom Exit, but a special ListenExit will be added to give back the chat control to the user.
   *
   * If `chat` is not provided, the execution will run in "Worker Mode", where it will not have access to a chat transcript.
   * In Worker Mode, the execution will iterate until it reaches an Exit or runs out of iterations.
   */
  chat?: Chat

  /**
   * Instructions for the LLM to follow.
   * This is a system prompt that will be used to guide the LLM's behavior.
   * It can be a simple string or a function that returns a string based on the current context (dynamic instructions).
   * Dynamic instructions are evaluated at the start of each iteration, allowing for context-aware instructions.
   */
  instructions?: ValueOrGetter<string, Context>

  /**
   * Objects available in the context.
   * Objects are useful to scope related tools together and to provide data to the VM.
   * Objects can contain "properties" that can be read and written to, as well as "tools" that can be executed.
   * Properties are type-safe and can be defined using a Zui schema.
   * Properties can be marked as read-only or writable.
   * The sandbox will ensure that properties are only modified if they are writable, and will also ensure that the values are valid according to the schema.
   *
   * Objects can be a static array of objects or a function that returns an array based on the current context.
   * Dynamic objects are evaluated at the start of each iteration, allowing for context-aware objects.
   *
   * Example:
   * An object "user" with properties "name" (string, writable) and "age" (number, read-only) will allow the LLM to see both properties and their values,
   * and executing the code `user.name = 'John'` will succeed, while `user.age = 30` will throw an error as the property is read-only.
   * Similarly, `user.name = 123` will throw an error as the value is not a string.
   */
  objects?: ValueOrGetter<ObjectInstance[], Context>

  /**
   * Tools available in the context.
   * Tools are functions that can be executed by the LLM to perform actions or retrieve data.
   * Tools can be defined with input and output schemas using Zui, and can be scoped to an object.
   * Tools can also have aliases, which are alternative names for the tool that can be used to call it.
   *
   * Tools can be a static array of tools or a function that returns an array based on the current context.
   * Dynamic tools are evaluated at the start of each iteration, allowing for context-aware tools.
   */
  tools?: ValueOrGetter<Tool[], Context>

  /**
   * Exits available in the context.
   * Exits define the possible endpoints for the execution. Every execution will either end with an exit, or run out of iterations.
   *
   * When `chat` is provided, the built-in "ListenExit" is automatically added.
   * When `exits` is not provided, the built-in "DefaultExit" is automatically added.
   *
   * Each exit has a name and can have aliases, which are alternative names for the exit that can be used to call it.
   * Exits can also have a Zui schema to validate the return value when the exit is reached.
   *
   * Exits can be a static array of exits or a function that returns an array based on the current context.
   * Dynamic exits are evaluated at the start of each iteration, allowing for context-aware exits.
   */
  exits?: ValueOrGetter<Exit[], Context>
  options?: Options

  /**
   * An instance of a Botpress Client or an instance of a Cognitive client (@botpress/cognitive).
   * This is used to generate content using the LLM and to access the Botpress API.
   * If not provided, a default client will be created using environment variables.
   */
  client?: Cognitive | BotpressClientLike | _CustomModelClient

  /**
   * When provided, the execution will immediately stop when the signal is aborted.
   * This will stop the LLM generation, as well as kill the VM sandbox execution.
   * Aborted iterations will end with IterationStatuses.Aborted and the execution will be marked as failed.
   */
  signal?: AbortSignal

  /**
   * A snapshot is a saved state of the execution context.
   * It can be used to resume the execution of a context at a later time.
   * This is useful for long-running executions that may need to be paused and resumed later.
   * The snapshot MUST be settled, which means it has to be resolved or rejected.
   * Providing an unsettled snapshot will throw an error.
   */
  snapshot?: Snapshot

  /**
   * The model to use for the LLM.
   * This can be a static model name or a function that returns a model name based on the current context.
   */
  model?: ValueOrGetter<Models | Models[], Context>

  /**
   * The temperature to use for the LLM.
   * This can be a static temperature or a function that returns a temperature based on the current context.
   * The temperature must be between 0 and 2.
   * If the temperature is outside this range, it will be clamped to the nearest valid value.
   * If no temperature is provided, the default temperature of 0.7 will be used.
   */
  temperature?: ValueOrGetter<number, Context>

  /**
   * The reasoning effort to use for models that support reasoning.
   * - "none": Disable reasoning (for models with optional reasoning)
   * - "low" | "medium" | "high": Fixed reasoning effort levels
   * - "dynamic": Let the provider automatically determine the reasoning effort
   * If not provided, the model will not use reasoning for models with optional reasoning.
   */
  reasoningEffort?: ValueOrGetter<'low' | 'medium' | 'high' | 'dynamic' | 'none', Context>

  /**
   * Arbitrary key-value metadata to attach to cognitive usage records for each LLM call.
   */
  metadata?: Record<string, string>
} & ExecutionHooks

export type RuntimeCognitive = Pick<Cognitive, 'getModelDetails' | 'generateText'> & {
  /**
   * Streaming generation. When present, the runtime streams the response and
   * parses ■ blocks incrementally.
   */
  generateTextStream?: Cognitive['generateTextStream']
}
