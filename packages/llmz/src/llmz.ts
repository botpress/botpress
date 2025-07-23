import { Cognitive, type BotpressClientLike } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'

import { clamp, isEqual, isPlainObject, omit } from 'lodash-es'
import ms from 'ms'

import { ulid } from 'ulid'
import { Chat } from './chat.js'
import { Context, Iteration } from './context.js'
import {
  AssignmentError,
  CodeExecutionError,
  InvalidCodeError,
  LoopExceededError,
  Signals,
  SnapshotSignal,
  ThinkSignal,
  VMSignal,
} from './errors.js'
import { Exit, ExitResult } from './exit.js'
import { ValueOrGetter } from './getter.js'

import { type ObjectInstance } from './objects.js'

import { ErrorExecutionResult, ExecutionResult, PartialExecutionResult, SuccessExecutionResult } from './result.js'
import { Snapshot } from './snapshots.js'
import { cleanStackTrace } from './stack-traces.js'
import { type Tool } from './tool.js'

import { truncateWrappedContent } from './truncator.js'
import { Trace } from './types.js'

import { init, stripInvalidIdentifiers } from './utils.js'
import { runAsyncFunction } from './vm.js'

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : JSON.stringify(err))

const SLOW_TOOL_WARNING = ms('15s')

const RESPONSE_LENGTH_BUFFER = {
  MIN_TOKENS: 1_000,
  MAX_TOKENS: 16_000,
  PERCENTAGE: 0.1,
} as const

const getModelOutputLimit = (inputLength: number) =>
  clamp(
    RESPONSE_LENGTH_BUFFER.PERCENTAGE * inputLength,
    RESPONSE_LENGTH_BUFFER.MIN_TOKENS,
    RESPONSE_LENGTH_BUFFER.MAX_TOKENS
  )

export type ExecutionHooks = {
  /**
   * NON-BLOCKING HOOK
   *   This hook will not block the execution of the iteration.
   * NON-MUTATION HOOK
   *   This hook can't mutate traces.
   *
   * This hook is called for each trace that is generated during the iteration.
   * It is useful for logging, debugging, or monitoring the execution of the iteration.
   */
  onTrace?: (event: { trace: Trace; iteration: number }) => void

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * NON-MUTATION HOOK
   *   This hook can't mutate the result or status of the iteration.
   *
   * This hook will be called after each iteration ends, regardless of the status.
   * This is useful for logging, cleanup or to prevent or delay the next iteration from starting.
   */
  onIterationEnd?: (iteration: Iteration) => Promise<void> | void

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
   */
  onExit?: <T = unknown>(result: ExitResult<T>) => Promise<void> | void

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * MUTATION HOOK
   *   This hook can mutate the code to run in the iteration.
   *
   * This hook is called after the LLM generates the code for the iteration, but before it is executed.
   * It is useful for modifying the code to run, or for guarding against certain code patterns.
   */
  onBeforeExecution?: (iteration: Iteration) => Promise<{ code?: string }>

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * MUTATION HOOK
   *   This hook can mutate the input to the tool.
   *
   * This hook is called before any tool is executed.
   * It is useful for modifying the input to a tool or prevent a tool from executing.
   */
  onBeforeTool?: (event: { iteration: Iteration; tool: Tool; input: any }) => Promise<{ input?: any }>

  /**
   * BLOCKING HOOK
   *   This hook will block the execution of the iteration until it resolves.
   * MUTATION HOOK
   *   This hook can mutate the output of the tool.
   *
   * This hook is called after a tool is executed.
   * It is useful for modifying the output of a tool or for logging purposes.
   */
  onAfterTool?: (event: { iteration: Iteration; tool: Tool; input: any; output: any }) => Promise<{ output?: any }>
}

type Options = Partial<Pick<Context, 'loop' | 'temperature' | 'model' | 'timeout'>>

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
   * An instance of a Botpress Client, or an instance of Cognitive Client (@botpress/cognitive).
   * This is used to generate content using the LLM and to access the Botpress API.
   */
  client: Cognitive | BotpressClientLike

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
} & ExecutionHooks

export const executeContext = async (props: ExecutionProps): Promise<ExecutionResult> => {
  await init()
  const result = await _executeContext(props)
  try {
    result.context.chat?.onExecutionDone?.(result)
  } catch {}
  return result
}

export const _executeContext = async (props: ExecutionProps): Promise<ExecutionResult> => {
  const { signal, onIterationEnd, onTrace, onExit, onBeforeExecution, onAfterTool, onBeforeTool } = props
  const cognitive = Cognitive.isCognitiveClient(props.client) ? props.client : new Cognitive({ client: props.client })
  const cleanups: (() => void)[] = []

  const ctx = new Context({
    chat: props.chat,
    instructions: props.instructions,
    objects: props.objects,
    tools: props.tools,
    loop: props.options?.loop,
    temperature: props.options?.temperature,
    model: props.options?.model,
    timeout: props.options?.timeout,
    exits: props.exits,
    snapshot: props.snapshot,
  })

  try {
    while (true) {
      if (ctx.iterations.length >= ctx.loop) {
        // TODO:
        return new ErrorExecutionResult(ctx, new LoopExceededError())
      }

      const iteration = await ctx.nextIteration()

      if (signal?.aborted) {
        iteration.end({
          type: 'aborted',
          aborted: {
            reason: signal.reason ?? 'The operation was aborted',
          },
        })

        return new ErrorExecutionResult(ctx, signal.reason ?? 'The operation was aborted')
      }

      cleanups.push(
        iteration.traces.onPush((traces) => {
          for (const trace of traces) {
            onTrace?.({ trace, iteration: ctx.iterations.length })
          }
        })
      )

      try {
        await executeIteration({
          iteration,
          ctx,
          cognitive,
          abortSignal: signal,
          onExit,
          onBeforeExecution,
          onAfterTool,
          onBeforeTool,
        })
      } catch (err) {
        // this should not happen, but if it does, we want to catch it and mark the iteration as failed and loop
        iteration.end({
          type: 'execution_error',
          execution_error: {
            message: 'An unexpected error occurred: ' + getErrorMessage(err),
            stack: cleanStackTrace((err as Error).stack ?? 'No stack trace available'),
          },
        })
      }

      try {
        await onIterationEnd?.(iteration)
      } catch (err) {
        console.error(err)
      }

      // Successful states
      if (iteration.status.type === 'exit_success') {
        const exitName = iteration.status.exit_success.exit_name

        return new SuccessExecutionResult(ctx, {
          exit: iteration.exits.find((x) => x.name === exitName)!,
          result: iteration.status.exit_success.return_value,
        })
      }

      if (iteration.status.type === 'callback_requested') {
        return new PartialExecutionResult(
          ctx,
          iteration.status.callback_requested.signal,
          Snapshot.fromSignal(iteration.status.callback_requested.signal)
        )
      }

      // Retryable errors
      if (
        iteration.status.type === 'thinking_requested' ||
        iteration.status.type === 'exit_error' ||
        iteration.status.type === 'execution_error' ||
        iteration.status.type === 'invalid_code_error'
      ) {
        continue
      }

      // Fatal errors
      return new ErrorExecutionResult(ctx, iteration.error ?? `Unknown error. Status: ${iteration.status.type}`)
    }
  } catch (error) {
    return new ErrorExecutionResult(ctx, error ?? 'Unknown error')
  } finally {
    for (const cleanup of cleanups) {
      try {
        cleanup()
      } catch {}
    }
  }
}

const executeIteration = async ({
  iteration,
  ctx,
  cognitive,
  abortSignal,
  onExit,
  onBeforeExecution,
  onBeforeTool,
  onAfterTool,
}: {
  ctx: Context
  iteration: Iteration
  cognitive: Cognitive
  abortSignal?: AbortController['signal']
} & ExecutionHooks): Promise<void> => {
  let startedAt = Date.now()
  const traces = iteration.traces
  const model = await cognitive.getModelDetails(ctx.model ?? 'best')
  const modelLimit = model.input.maxTokens
  const responseLengthBuffer = getModelOutputLimit(modelLimit)

  const messages = truncateWrappedContent({
    messages: iteration.messages,
    tokenLimit: modelLimit - responseLengthBuffer,
    throwOnFailure: true,
  }).filter(
    (x) =>
      // Filter out empty messages, as they are not valid inputs for the LLM
      // This can happen when a message is truncated and the content is empty
      typeof x.content !== 'string' || x.content.trim().length > 0
  )

  traces.push({
    type: 'llm_call_started',
    started_at: startedAt,
    ended_at: startedAt,
    model: model.ref,
  })

  const output = await cognitive.generateContent({
    signal: abortSignal,
    systemPrompt: messages.find((x) => x.role === 'system')?.content,
    model: model.ref,
    temperature: ctx.temperature,
    responseFormat: 'text',
    messages: messages.filter((x) => x.role !== 'system'),
    stopSequences: ctx.version.getStopTokens(),
  })

  const out =
    output.output.choices?.[0]?.type === 'text' && typeof output.output.choices?.[0].content === 'string'
      ? output.output.choices[0].content
      : null

  if (!out) {
    throw new Error('No output from LLM')
  }

  const assistantResponse = ctx.version.parseAssistantResponse(out)

  iteration.code = assistantResponse.code.trim()

  if (typeof onBeforeExecution === 'function') {
    try {
      const hookRes = await onBeforeExecution(iteration)
      if (typeof hookRes?.code === 'string' && hookRes.code.trim().length > 0) {
        iteration.code = hookRes.code.trim()
      }
    } catch (err) {
      if (err instanceof ThinkSignal) {
        return iteration.end({
          type: 'thinking_requested',
          thinking_requested: {
            variables: err.context,
            reason: err.reason,
          },
        })
      }

      return iteration.end({
        type: 'execution_error',
        execution_error: {
          message: `Error in onBeforeExecution hook: ${getErrorMessage(err)}`,
          stack: cleanStackTrace((err as Error).stack ?? 'No stack trace available'),
        },
      })
    }
  }

  iteration.llm = {
    cached: output.meta.cached || false,
    ended_at: Date.now(),
    started_at: startedAt,
    status: 'success',
    tokens: output.meta.tokens.input + output.meta.tokens.output,
    spend: output.meta.cost.input + output.meta.cost.output,
    output: assistantResponse.raw,
    model: `${output.meta.model.integration}:${output.meta.model.model}`,
  }

  traces.push({
    type: 'llm_call_success',
    started_at: startedAt,
    ended_at: iteration.llm.ended_at,
    model: model.ref,
    code: iteration.code,
  })

  const vmContext = { ...stripInvalidIdentifiers(iteration.variables) }

  for (const obj of iteration.objects) {
    const internalValues: Record<string, string> = {}
    const instance: Record<string, any> = {}

    for (const { name, value, writable, type } of obj.properties ?? []) {
      internalValues[name] = value

      const initialValue = value
      const schema = type ?? z.any()

      Object.defineProperty(instance, name, {
        enumerable: true,
        configurable: true,
        get() {
          return internalValues[name]
        },
        set(value) {
          if (isEqual(value, internalValues[name])) {
            return
          }

          if (!writable) {
            throw new AssignmentError(`Property ${obj.name}.${name} is read-only and cannot be modified`)
          }

          if (value === internalValues[name]) {
            return
          }

          const parsed = schema.safeParse(value)

          if (!parsed.success) {
            throw new AssignmentError(
              `Invalid value for Object property ${obj.name}.${name}: ${getErrorMessage(parsed.error)}`
            )
          }

          internalValues[name] = parsed.data

          traces.push({
            type: 'property',
            started_at: Date.now(),
            object: obj.name,
            property: name,
            value: parsed.data,
          })

          iteration.trackMutation({ object: obj.name, property: name, before: initialValue, after: parsed.data })
        },
      })
    }

    for (const tool of obj.tools ?? []) {
      instance[tool.name] = wrapTool({
        tool,
        traces,
        object: obj.name,
        iteration,
        beforeHook: onBeforeTool,
        afterHook: onAfterTool,
      })
    }

    Object.preventExtensions(instance)
    Object.seal(instance)

    vmContext[obj.name] = instance
  }

  for (const tool of iteration.tools) {
    const wrapped = wrapTool({ tool, traces, iteration, beforeHook: onBeforeTool, afterHook: onAfterTool })
    for (const key of [tool.name, ...(tool.aliases ?? [])]) {
      vmContext[key] = wrapped
    }
  }

  if (abortSignal?.aborted) {
    traces.push({
      type: 'abort_signal',
      started_at: Date.now(),
      reason: 'The operation was aborted by user.',
    })
    // TODO: handle abortions better.. there's more than one path possible

    return iteration.end({
      type: 'aborted',
      aborted: {
        reason: abortSignal?.reason ?? 'The operation was aborted',
      },
    })
  }

  type Result = Awaited<ReturnType<typeof runAsyncFunction>>

  startedAt = Date.now()
  const result: Result = await runAsyncFunction(vmContext, iteration.code, traces, abortSignal, ctx.timeout).catch(
    (err) => {
      return {
        success: false,
        error: err as Error,
        lines_executed: [],
        traces: [],
        variables: {},
      } satisfies Result
    }
  )

  if (result.error && result.error instanceof InvalidCodeError) {
    return iteration.end({
      type: 'invalid_code_error',
      invalid_code_error: {
        message: result.error.message,
      },
    })
  }

  traces.push({
    type: 'code_execution',
    lines_executed: result.lines_executed ?? 0,
    started_at: startedAt,
    ended_at: Date.now(),
  })

  if (result.error && result.error instanceof CodeExecutionError) {
    return iteration.end({
      type: 'execution_error',
      execution_error: {
        message: result.error.message,
        stack: cleanStackTrace(result.error.stacktrace ?? result.error.stack ?? 'No stack trace available'),
      },
    })
  }

  if (abortSignal?.aborted) {
    return iteration.end({
      type: 'aborted',
      aborted: {
        reason: abortSignal?.reason ?? 'The operation was aborted',
      },
    })
  }

  if (!result.success) {
    return iteration.end({
      type: 'execution_error',
      execution_error: {
        message: result?.error?.message ?? 'Unknown error occurred',
        stack: cleanStackTrace(result.error.stack ?? 'No stack trace available'),
      },
    })
  }

  if (result.signal instanceof ThinkSignal) {
    return iteration.end({
      type: 'thinking_requested',
      thinking_requested: {
        variables: result.signal.context,
        reason: result.signal.reason,
      },
    })
  }

  if (result.signal instanceof SnapshotSignal) {
    return iteration.end({
      type: 'callback_requested',
      callback_requested: {
        signal: result.signal,
      },
    })
  }

  const validActions = [...iteration.exits.map((x) => x.name.toLowerCase()), 'think']
  let returnValue: { action: string; value?: unknown } | null =
    result.success && result.return_value ? result.return_value : null

  const returnAction = returnValue?.action
  const returnExit =
    iteration.exits.find((x) => x.name.toLowerCase() === returnAction?.toLowerCase()) ??
    iteration.exits.find((x) => x.aliases.some((a) => a.toLowerCase() === returnAction?.toLowerCase()))

  if (returnAction === 'think') {
    const variables = omit(returnValue ?? {}, 'action')
    if (isPlainObject(variables) && Object.keys(variables).length > 0) {
      return iteration.end({
        type: 'thinking_requested',
        thinking_requested: {
          variables,
          reason: 'Thinking requested',
        },
      })
    }

    return iteration.end({
      type: 'thinking_requested',
      thinking_requested: {
        reason: 'Thinking requested',
        variables: iteration.variables,
      },
    })
  }

  if (!returnAction) {
    return iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: 'n/a',
        message: `Code did not return an action. Valid actions are: ${validActions.join(', ')}`,
        return_value: returnValue,
      },
    })
  }

  if (!returnExit) {
    return iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: returnAction,
        message: `Exit "${returnAction}" not found. Valid actions are: ${validActions.join(', ')}`,
        return_value: returnValue,
      },
    })
  }

  if (returnExit.zSchema) {
    const parsed = returnExit.zSchema.safeParse(returnValue?.value)
    if (!parsed.success) {
      return iteration.end({
        type: 'exit_error',
        exit_error: {
          exit: returnExit.name,
          message: `Invalid return value for exit ${returnExit.name}: ${getErrorMessage(parsed.error)}`,
          return_value: returnValue,
        },
      })
    }
    returnValue = { action: returnExit.name, value: parsed.data }
  }

  try {
    await onExit?.({
      exit: returnExit,
      result: returnValue?.value,
    })
  } catch (err) {
    return iteration.end({
      type: 'exit_error',
      exit_error: {
        exit: returnExit.name,
        message: `Error executing exit ${returnExit.name}: ${getErrorMessage(err)}`,
        return_value: returnValue,
      },
    })
  }

  return iteration.end({
    type: 'exit_success',
    exit_success: {
      exit_name: returnExit.name,
      return_value: returnValue?.value,
    },
  })
}

type Props = {
  tool: Tool
  object?: string
  traces: Trace[]
  iteration: Iteration
  beforeHook?: ExecutionHooks['onBeforeTool']
  afterHook?: ExecutionHooks['onAfterTool']
}

function wrapTool({ tool, traces, object, iteration, beforeHook, afterHook }: Props) {
  const getToolInput = (input: any) => tool.zInput.safeParse(input).data ?? input

  return function (input: any) {
    const toolCallId = `tcall_${ulid()}`

    const alertSlowTool = setTimeout(
      () =>
        traces.push({
          type: 'tool_slow',
          tool_name: tool.name,
          tool_call_id: toolCallId,
          started_at: Date.now(),
          input: getToolInput(input),
          object,
          duration: SLOW_TOOL_WARNING,
        }),
      SLOW_TOOL_WARNING
    )

    const cancelSlowTool = () => clearTimeout(alertSlowTool)

    const toolStart = Date.now()
    let output: any
    let error: any
    let success = true

    const handleSignals = (error: any) => {
      if (output === error) {
        return true
      }

      if (error instanceof SnapshotSignal) {
        error.toolCall = {
          name: tool.name,
          inputSchema: tool.input,
          outputSchema: tool.output,
          input,
        }
        error.message = Signals.serializeError(error)
      }

      if (error instanceof ThinkSignal) {
        traces.push({
          type: 'think_signal',
          started_at: Date.now(),
          line: 0,
          ended_at: Date.now(),
        })
        success = true
        output = error
        return true
      }

      return false
    }

    try {
      const withHooks = async (input: any): Promise<any> => {
        const beforeRes = await beforeHook?.({
          iteration,
          tool,
          input,
        })

        if (typeof beforeRes?.input !== 'undefined') {
          input = beforeRes.input
        }

        let output = await tool.execute(input, {
          callId: toolCallId,
        })

        const afterRes = await afterHook?.({
          iteration,
          tool,
          input,
          output,
        })

        if (typeof afterRes?.output !== 'undefined') {
          output = afterRes.output
        }

        return output
      }

      const result = withHooks(input)

      if (result instanceof Promise || ((result as any)?.then && (result as any)?.catch)) {
        return result
          .then((res: any) => {
            output = res
            success = true
            return res
          })
          .catch((err: any) => {
            if (!handleSignals(err)) {
              success = false
              error = err
            }

            // Important: we want to re-throw signals so that the VM can handle them
            throw err
          })
          .finally(() => {
            cancelSlowTool()
            traces.push({
              type: 'tool_call',
              tool_call_id: toolCallId,
              started_at: toolStart,
              ended_at: Date.now(),
              tool_name: tool.name,
              object,
              input: getToolInput(input),
              output,
              error,
              success,
            })
          })
      }

      success = true
      output = result
    } catch (err) {
      if (!handleSignals(err)) {
        success = false
        error = err
      }
    }

    cancelSlowTool()
    traces.push({
      type: 'tool_call',
      tool_call_id: toolCallId,
      started_at: toolStart,
      ended_at: Date.now(),
      tool_name: tool.name,
      object,
      input: getToolInput(input),
      output,
      error,
      success,
    })

    if (!success) {
      throw error
    }

    if (output instanceof VMSignal) {
      // Important: we want to re-throw signals so that the VM can handle them
      throw output
    }

    return output
  }
}
