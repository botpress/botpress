import { z } from '@bpinternal/zui'

import { omit, clamp, isPlainObject, isEqual } from 'lodash-es'
import ms from 'ms'
import { ulid } from 'ulid'

import { CognitiveClient } from './client.js'
import { Context, createContext } from './context.js'
import {
  AssignmentError,
  CodeExecutionError,
  ExecuteSignal,
  InvalidCodeError,
  ListenSignal,
  LoopExceededError,
  Signals,
  ThinkSignal,
  TransitionSignal,
  VMInterruptSignal,
  VMSignal,
} from './errors.js'
import { HookedArray } from './handlers.js'
import { makeObject, ObjectInstance } from './objects.js'

import { createSnapshot, rejectContextSnapshot, resolveContextSnapshot } from './snapshots.js'
import { ToolImplementation, Tools, makeTool } from './tools.js'
import { TranscriptMessage } from './transcript.js'
import { truncateWrappedContent, wrapContent } from './truncator.js'
import { ExecutionResult, Iteration, ObjectMutation, Trace } from './types.js'
import { Tokens, init, stripInvalidIdentifiers } from './utils.js'
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
   * Called after the notebook execution ends.
   *
   * **Warning**: This should not be a long task as it blocks the execution
   */
  onIterationEnd?: (iteration: Iteration) => Promise<void> | void
  /**
   * Called before the notebook execution starts; after the LLM call and notebook parsing
   *
   * **Warning**: This should not be a long task as it blocks the execution
   */
  onIterationStart?: (iteration: Partial<Iteration>) => Promise<void> | void
  onTrace?: (event: { trace: Trace; iteration: number }) => void
}

type Options = {
  loop?: number
  temperature?: number
  model?: string
}

export type ExecutionProps = {
  instructions?: string
  objects?: ObjectInstance[]
  tools?: ToolImplementation[]
  options?: Options
  transcript?: TranscriptMessage[]
  cognitive: CognitiveClient
  signal?: AbortController['signal']
} & ExecutionHooks

const executeContext = async (props: ExecutionProps): Promise<ExecutionResult> => {
  await init()

  const ctx = createContext({
    instructions: props.instructions,
    objects: props.objects,
    tools: props.tools,
    loop: props.options?.loop,
    temperature: props.options?.temperature,
    model: props.options?.model,
    transcript: props.transcript,
  })

  const { cognitive, signal, onIterationEnd, onTrace, onIterationStart } = props

  const iterations: Iteration[] = []

  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error('The operation was aborted.')
      }

      const iterationId = ctx.id + '_' + (iterations.length + 1)

      try {
        const traces = new HookedArray<Trace>()

        traces.onPush((traces) => {
          for (const trace of traces) {
            onTrace?.({ trace, iteration: iterations.length })
          }
        })

        const iteration = await executeIteration({
          id: iterationId,
          ctx,
          cognitive,
          traces,
          abortSignal: signal,
          onIterationStart,
        })

        iterations.push(iteration)

        try {
          await onIterationEnd?.(iteration)
        } catch (err) {
          console.error(err)
        }

        if (signal?.aborted) {
          throw new Error('The operation was aborted.')
        }
        if (iteration.status === 'success' && iteration.signal instanceof VMInterruptSignal) {
          return {
            status: 'interrupted',
            snapshot: createSnapshot(iteration.signal),
            iterations,
            context: ctx,
            signal: iteration.signal,
          }
        }

        if (iteration.status === 'success') {
          return {
            status: 'success',
            iterations,
            context: ctx,
          }
        }

        if (iteration.status === 'partial' && iteration.signal instanceof ThinkSignal) {
          // we add the thinking context to the injected variables so that the next iteration can use them
          if (isPlainObject(iteration.variables)) {
            Object.assign(ctx.injectedVariables, iteration.variables)
          }

          if (isPlainObject(iteration.signal.context)) {
            Object.assign(ctx.injectedVariables, iteration.signal.context)
          }
        }
      } catch (error) {
        if (error instanceof LoopExceededError) {
          throw error
        }
        // The iteration should be in the list even though it failed internally
        iterations.push({
          id: generateIterationId(),
          status: 'error',
          error: error instanceof Error ? error : new Error(error?.toString() ?? 'Unknown error'),
          messages: await ctx.getMessages(),
          variables: {},
          traces: [],
          mutations: [],
          llm: {
            started_at: Date.now(),
            ended_at: Date.now(),
            status: 'error',
            cached: false,
            tokens: 0,
            spend: 0,
            output: '',
            model: ctx.__options.model,
          },
          started_ts: Date.now(),
          ended_ts: Date.now(),
        })

        throw error
      }
    }
  } catch (error) {
    return {
      status: 'error',
      iterations,
      context: ctx,
      error: error instanceof Error ? error : new Error(error?.toString() ?? 'Unknown error'),
    }
  }
}

const generateIterationId = () => `iteration_${ulid()}`

const executeIteration = async ({
  id,
  ctx,
  cognitive,
  traces,
  abortSignal,
  onIterationStart,
}: {
  id: string
  ctx: Context
  cognitive: CognitiveClient
  traces: Trace[]
  abortSignal?: AbortController['signal']
} & ExecutionHooks): Promise<Iteration> => {
  if (ctx.iteration++ >= ctx.__options.loop) {
    throw new LoopExceededError()
  }

  const startedAt = Date.now()

  const modelLimit = 128_000 // ctx.__options.model // TODO: fixme
  const responseLengthBuffer = getModelOutputLimit(modelLimit)

  const messages = truncateWrappedContent({
    messages: await ctx.getMessages(),
    tokenLimit: modelLimit - responseLengthBuffer,
    throwOnFailure: false,
  }).filter(
    (x) =>
      // Filter out empty messages, as they are not valid inputs for the LLM
      // This can happen when a message is truncated and the content is empty
      x.content.trim().length > 0
  )

  const [integration, model] = ctx.__options.model!.split('__')

  const output = await cognitive({
    integration: integration!,
    systemPrompt: messages.find((x) => x.role === 'system')?.content,
    model: { id: model! },
    temperature: ctx.__options.temperature,
    responseFormat: 'text',
    messages: messages
      .filter((x) => x.role === 'user' || x.role === 'assistant')
      .map(
        (x) =>
          ({
            role: x.role === 'user' ? 'user' : 'assistant',
            type: 'text',
            content: x.content,
          }) as const
      ),
    stopSequences: ctx.version.getStopTokens(),
  })

  const out =
    output.choices?.[0]?.type === 'text' && typeof output.choices?.[0].content === 'string'
      ? output.choices[0].content
      : null

  if (!out) {
    throw new Error('No output from LLM')
  }

  const assistantResponse = ctx.version.parseAssistantResponse(out)

  const llm = {
    cached: output.metadata.cached,
    ended_at: Date.now(),
    started_at: startedAt,
    status: 'success',
    tokens: output.usage.inputTokens + output.usage.outputTokens,
    spend: output.botpress.cost ?? 0,
    output: assistantResponse.raw,
    model: ctx.__options.model,
  } satisfies Iteration['llm']

  traces.push({
    type: 'llm_call',
    started_at: startedAt,
    ended_at: llm.ended_at,
    status: 'success',
    model: ctx.__options.model,
  })

  if (assistantResponse.type !== 'code') {
    throw new Error('Only code responses are supported')
  }

  try {
    await onIterationStart?.({ id, traces, llm, started_ts: startedAt, messages })
  } catch {}

  const iterationProps: Partial<Iteration> = {
    id,
    message: undefined,
    code: undefined,
  }

  const vmContext = { ...stripInvalidIdentifiers(ctx.injectedVariables) }

  const changes = new Map<string, ObjectMutation>()

  for (const obj of ctx.__options.objects) {
    const internalValues: Record<string, string> = {}
    const instance: Record<string, any> = {}

    for (const { name, value, writable, type } of obj.properties ?? []) {
      internalValues[name] = value
      const changeSet = `${obj.name}.${name}`
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

          changes.set(changeSet, { object: obj.name, property: name, before: initialValue, after: parsed.data })
        },
      })
    }

    for (const tool of obj.tools) {
      instance[tool.name] = wrapTool({ tool, traces, object: obj.name })
    }

    Object.preventExtensions(instance)
    Object.seal(instance)

    vmContext[obj.name] = instance
  }

  for (const tool of ctx.__options.tools) {
    const wrapped = wrapTool({ tool, traces })
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
    return {
      ...iterationProps,
      code: assistantResponse.code.trim(),
      id,
      status: 'error',
      variables: {},
      error: new Error('The operation was aborted.'),
      started_ts: startedAt,
      mutations: [...changes.values()],
      ended_ts: Date.now(),
      llm,
      traces,
      messages: [...messages],
    } satisfies Iteration
  }

  let result: Awaited<ReturnType<typeof runAsyncFunction>> | InvalidCodeError
  // This is temporary, until we support full notebook behaviour, that is, multiple code blocks and messages executed in sequence
  // In that scenario, the non-code blocks will become messages and llmz will take responsibility of telling its consumers what messages are meant for the user

  try {
    result = await runAsyncFunction(vmContext, assistantResponse.code.trim(), traces)
  } catch (err) {
    if (err instanceof InvalidCodeError) {
      result = err
    } else {
      throw err
    }
  }

  if (result instanceof InvalidCodeError) {
    ctx.partialExecutionMessages.push({
      role: 'assistant',
      content: wrapContent(assistantResponse.raw, { preserve: 'top', flex: 4, minTokens: 25 }),
    })

    ctx.partialExecutionMessages.push(await ctx.version.getInvalidCodeMessage({ error: result }))

    return {
      ...iterationProps,
      code: assistantResponse.code.trim(),
      id,
      status: 'error',
      variables: {},
      error: result,
      started_ts: startedAt,
      mutations: [...changes.values()],
      ended_ts: Date.now(),
      llm,
      traces,
      messages: [...messages],
    } satisfies Iteration
  }

  let signal = result.signal

  if (result.success && result.return_value?.action === 'think') {
    signal = new ThinkSignal('Thinking requested', omit(result.return_value, 'action'))
    signal.variables = result.variables
  }

  if (signal instanceof ThinkSignal) {
    // If there's no variables, it means the code block didn't execute any code
    // Since every tool call is assigned to a variable, we can assume that if there's no variables, there's no tool calls
    // Similarly, if there's no variables, there's no JS computation such as "const a = 1 + 1"
    // More importantly, if there's no variables, there's nothing to think about that the initial context doesn't already know

    // TODO: in the future, remove the below line entirely, as it's a temporary workaround to prevent overthinking of Aug/Jul prompts
    // They used to be able to "think" at any time by calling a tool
    const hasExecutedCode = ctx.version.version === '01-Oct-2024' ? true : Object.keys(signal.variables).length > 0
    if (!hasExecutedCode) {
      // If there's no code execution, we don't need to think about anything, we can just exit successfully
      // There's no need to push the code execution trace, as there was no code execution worth logging
      return {
        ...iterationProps,
        code: assistantResponse.code.trim(),
        id,
        status: 'success',
        variables: result.variables,
        signal,
        started_ts: startedAt,
        ended_ts: Date.now(),
        llm,
        mutations: [...changes.values()],
        traces: result.traces,
        messages: [...messages],
        return_value: result.success ? result.return_value : undefined,
      } satisfies Iteration
    }

    ctx.partialExecutionMessages.push({
      role: 'assistant',
      content: wrapContent(assistantResponse.raw, { preserve: 'top', flex: 4, minTokens: 25 }),
    })

    ctx.partialExecutionMessages.push(await ctx.version.getThinkingMessage({ signal }))

    traces.push({
      type: 'code_execution',
      lines_executed: result.lines_executed,
      started_at: startedAt,
      ended_at: Date.now(),
    })

    return {
      ...iterationProps,
      code: assistantResponse.code.trim(),
      id,
      variables: result.signal?.variables ?? {},
      status: 'partial',
      signal,
      started_ts: startedAt,
      mutations: [...changes.values()],
      ended_ts: Date.now(),
      llm,
      traces: result.traces,
      messages: [...messages],
    } satisfies Iteration
  }

  if (result.success || signal instanceof VMInterruptSignal) {
    ctx.partialExecutionMessages = []
    ctx.iteration = 0

    traces.push({
      type: 'code_execution',
      lines_executed: result.lines_executed,
      started_at: startedAt,
      ended_at: Date.now(),
    })

    return {
      ...iterationProps,
      code: assistantResponse.code.trim(),
      id,
      status: 'success',
      variables: result.variables,
      signal,
      started_ts: startedAt,
      ended_ts: Date.now(),
      llm,
      mutations: [...changes.values()],
      traces: result.traces,
      messages: [...messages],
      return_value: result.success ? result.return_value : undefined,
    } satisfies Iteration
  }

  if (result.error instanceof CodeExecutionError) {
    ctx.partialExecutionMessages.push({
      role: 'assistant',
      content: wrapContent(assistantResponse.raw, { preserve: 'top', flex: 4, minTokens: 25 }),
    })

    ctx.partialExecutionMessages.push(await ctx.version.getCodeExecutionErrorMessage({ error: result.error }))

    return {
      ...iterationProps,
      code: assistantResponse.code.trim(),
      id,
      status: 'error',
      variables: result.variables,
      error: result.error,
      started_ts: startedAt,
      mutations: [...changes.values()],
      ended_ts: Date.now(),
      llm,
      traces: result.traces,
      messages: [...messages],
    } satisfies Iteration
  }

  throw result.error
}

type Tool = Context['__options']['tools'][number]
type Props = {
  tool: Tool
  object?: string
  traces: Trace[]
}

function wrapTool({ tool, traces, object }: Props) {
  const getToolInput = (input: any) => tool.input?.safeParse(input).data ?? input

  const fn = (tool as Tools.Implementation).fn

  return function (input: any, ctx: any) {
    const alertSlowTool = setTimeout(
      () =>
        traces.push({
          type: 'tool_slow',
          tool_name: tool.name,
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

      if (error instanceof VMInterruptSignal) {
        error.toolCall = {
          name: tool.name,
          inputSchema: tool.input?.toJsonSchema(),
          outputSchema: tool.output?.toJsonSchema(),
          input,
        }
        error.message = Signals.serializeError(error)
      }

      if (error instanceof ListenSignal) {
        traces.push({
          type: 'listen_signal',
          started_at: Date.now(),
          line: 0,
          ended_at: Date.now(),
        })
        success = true
        output = error
        return true
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

      if (error instanceof ExecuteSignal || error instanceof TransitionSignal) {
        traces.push({
          type: 'execute_signal',
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
      const result = fn(input, { ...ctx, traces })
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

export const llmz = {
  Tokens,
  makeTool,
  makeObject,
  executeContext,
  createSnapshot,
  resolveContextSnapshot,
  rejectContextSnapshot,
}
