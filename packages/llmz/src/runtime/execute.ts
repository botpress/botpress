import { Client } from '@botpress/client'
import { Cognitive, type BotpressClientLike } from '@botpress/cognitive'

import { createJoinedAbortController } from '../abort-signal.js'
import { Context, Iteration } from '../context.js'
import { _CustomModelClient } from '../custom-client.js'
import { CognitiveError, LoopExceededError, ThinkSignal } from '../errors.js'
import { createJsxComponent } from '../jsx.js'
import { unwrapJsonWrappedBody } from '../message-stream/sanitize.js'
import { ErrorExecutionResult, ExecutionResult, PartialExecutionResult, SuccessExecutionResult } from '../result.js'
import { Snapshot } from '../snapshots.js'
import { cleanStackTrace } from '../stack-traces.js'
import { VMExecutionResult } from '../types.js'
import { getErrorMessage, init } from '../utils.js'
import { runAsyncFunction, warmupVM } from '../vm/index.js'
import { generateCode } from './generate.js'
import { applyNextExit, interpretVMResult } from './interpret-result.js'
import { ExecutionHooks, ExecutionProps, RuntimeCognitive } from './types.js'
import { finalizeIteration } from './utils.js'
import { buildVMContext } from './vm-context.js'

type Result<TType extends 'proceed' | 'continue' | 'return'> = TType extends 'return'
  ? {
      type: TType
      result: ExecutionResult
    }
  : {
      type: TType
    }

export const executeContext = async (props: ExecutionProps): Promise<ExecutionResult> => {
  await init()
  const result = await executeContextInternal(props)
  try {
    result.context.chat?.onExecutionDone?.(result)
  } catch (err: unknown) {
    void err
    // Best-effort hook; preserve execution result even if the callback fails.
  }
  return result
}

const executeContextInternal = async (props: ExecutionProps): Promise<ExecutionResult> => {
  const controller = createJoinedAbortController([props.signal])
  const { onIterationStart, onIterationEnd, onTrace, onExit, onBeforeExecution, onAfterTool, onBeforeTool } = props

  const client = props.client ?? new Client()

  const cognitive: RuntimeCognitive =
    Cognitive.isCognitiveClient(client) || _CustomModelClient.isCustomClient(client)
      ? client
      : new Cognitive({ client: client as BotpressClientLike })

  const ctx = new Context({
    chat: props.chat,
    instructions: props.instructions,
    objects: props.objects,
    tools: props.tools,
    loop: props.options?.loop,
    timeout: props.options?.timeout,
    maxTokens: props.options?.maxTokens,
    maxTimeToFirstToken: props.options?.maxTimeToFirstToken,
    transcriptionModel: props.options?.transcriptionModel,
    exits: props.exits,
    snapshot: props.snapshot,
    model: props.model,
    temperature: props.temperature,
    reasoningEffort: props.reasoningEffort,
  })

  try {
    while (true) {
      if (ctx.iterations.length >= ctx.loop) {
        return new ErrorExecutionResult(ctx, new LoopExceededError())
      }

      const iteration = await ctx.nextIteration()

      const unsubscribeTrace = iteration.traces.onPush((traces) => {
        for (const trace of traces) {
          onTrace?.({ trace, iteration: ctx.iterations.length, controller })
        }
      })

      try {
        const startHookResult = await executeIterationStartHook({
          ctx,
          iteration,
          controller,
          onIterationStart,
          onIterationEnd,
        })
        if (startHookResult.type === 'continue') {
          continue
        }

        if (controller.signal.aborted) {
          await finalizeIteration({
            iteration,
            controller,
            onIterationEnd,
            status: {
              type: 'aborted',
              aborted: {
                reason: controller.signal.reason ?? 'The operation was aborted',
              },
            },
          })

          return new ErrorExecutionResult(ctx, controller.signal.reason ?? 'The operation was aborted')
        }

        const iterationResult = await executeIterationWithErrorHandling({
          iteration,
          ctx,
          cognitive,
          controller,
          onExit,
          onBeforeExecution,
          onAfterTool,
          onBeforeTool,
          onIterationEnd,
          metadata: props.metadata,
        })
        if (iterationResult.type === 'return') {
          return iterationResult.result
        }

        const selectedResult = transformIterationResult({ ctx, iteration })
        if (selectedResult.type === 'continue') {
          continue
        }

        return selectedResult.result
      } finally {
        try {
          unsubscribeTrace()
        } catch (err: unknown) {
          void err
          // Best-effort cleanup; trace subscribers should not affect execution.
        }
      }
    }
  } catch (error) {
    return new ErrorExecutionResult(ctx, error ?? 'Unknown error')
  }
}

const executeIterationStartHook = async ({
  ctx,
  iteration,
  controller,
  onIterationStart,
  onIterationEnd,
}: {
  ctx: Context
  iteration: Iteration
  controller: AbortController
  onIterationStart?: ExecutionHooks['onIterationStart']
  onIterationEnd?: ExecutionHooks['onIterationEnd']
}): Promise<Result<'proceed' | 'continue'>> => {
  try {
    const hookRes = await onIterationStart?.(iteration, controller, ctx)
    if (hookRes) {
      Object.assign(iteration, hookRes)
    }
    return { type: 'proceed' }
  } catch (err) {
    await finalizeIteration({
      iteration,
      controller,
      onIterationEnd,
      status:
        err instanceof ThinkSignal
          ? {
              type: 'thinking_requested',
              thinking_requested: {
                variables: err.context,
                reason: err.reason,
              },
            }
          : {
              type: 'execution_error',
              execution_error: {
                message: `Error in onIterationStart hook: ${getErrorMessage(err)}`,
                stack: cleanStackTrace(
                  err instanceof Error ? (err.stack ?? 'No stack trace available') : 'No stack trace available'
                ),
              },
            },
    })

    return { type: 'continue' }
  }
}

const executeIterationWithErrorHandling = async ({
  iteration,
  ctx,
  cognitive,
  controller,
  onExit,
  onBeforeExecution,
  onAfterTool,
  onBeforeTool,
  onIterationEnd,
  metadata,
}: {
  ctx: Context
  iteration: Iteration
  cognitive: RuntimeCognitive
  controller: AbortController
  onExit?: ExecutionHooks['onExit']
  onBeforeExecution?: ExecutionHooks['onBeforeExecution']
  onAfterTool?: ExecutionHooks['onAfterTool']
  onBeforeTool?: ExecutionHooks['onBeforeTool']
  onIterationEnd?: ExecutionHooks['onIterationEnd']
  metadata?: ExecutionProps['metadata']
}): Promise<Result<'proceed' | 'return'>> => {
  try {
    await executeIteration({
      iteration,
      ctx,
      cognitive,
      controller,
      onExit,
      onBeforeExecution,
      onAfterTool,
      onBeforeTool,
      metadata,
    })

    await finalizeIteration({ iteration, controller, onIterationEnd })
    return { type: 'proceed' }
  } catch (err) {
    if (!(err instanceof CognitiveError)) {
      await finalizeIteration({
        iteration,
        controller,
        onIterationEnd,
        status:
          iteration.status.type === 'pending'
            ? {
                type: 'execution_error',
                execution_error: {
                  message: 'An unexpected error occurred: ' + getErrorMessage(err),
                  stack: cleanStackTrace(
                    err instanceof Error ? (err.stack ?? 'No stack trace available') : 'No stack trace available'
                  ),
                },
              }
            : undefined,
      })
      return { type: 'proceed' }
    }

    if (!controller.signal.aborted) {
      return {
        type: 'return',
        result: new ErrorExecutionResult(ctx, err),
      }
    }

    await finalizeIteration({
      iteration,
      controller,
      onIterationEnd,
      status:
        iteration.status.type === 'pending'
          ? {
              type: 'aborted',
              aborted: {
                reason: controller.signal.reason ?? 'The operation was aborted',
              },
            }
          : undefined,
    })

    return {
      type: 'return',
      result: new ErrorExecutionResult(ctx, controller.signal.reason ?? 'The operation was aborted'),
    }
  }
}

const transformIterationResult = ({
  ctx,
  iteration,
}: {
  ctx: Context
  iteration: Iteration
}): Result<'continue' | 'return'> => {
  if (iteration.status.type === 'exit_success') {
    const exitName = iteration.status.exit_success.exit_name
    return {
      type: 'return',
      result: new SuccessExecutionResult(ctx, {
        exit: iteration.exits.find((x) => x.name === exitName)!,
        result: iteration.status.exit_success.return_value,
      }),
    }
  }

  if (iteration.status.type === 'callback_requested') {
    return {
      type: 'return',
      result: new PartialExecutionResult(
        ctx,
        iteration.status.callback_requested.signal,
        Snapshot.fromSignal(iteration.status.callback_requested.signal)
      ),
    }
  }

  if (iteration.status.type === 'aborted') {
    return {
      type: 'return',
      result: new ErrorExecutionResult(ctx, iteration.error ?? 'The operation was aborted'),
    }
  }

  if (
    iteration.status.type === 'thinking_requested' ||
    iteration.status.type === 'exit_error' ||
    iteration.status.type === 'execution_error' ||
    iteration.status.type === 'invalid_code_error'
  ) {
    return { type: 'continue' }
  }

  return {
    type: 'return',
    result: new ErrorExecutionResult(ctx, iteration.error ?? `Unknown error. Status: ${iteration.status.type}`),
  }
}

const executeIteration = async ({
  iteration,
  ctx,
  cognitive,
  controller,
  onExit,
  onBeforeExecution,
  onBeforeTool,
  onAfterTool,
  metadata,
}: {
  ctx: Context
  iteration: Iteration
  cognitive: RuntimeCognitive
  controller: AbortController
  onExit?: ExecutionHooks['onExit']
  onBeforeExecution?: ExecutionHooks['onBeforeExecution']
  onBeforeTool?: ExecutionHooks['onBeforeTool']
  onAfterTool?: ExecutionHooks['onAfterTool']
  metadata?: ExecutionProps['metadata']
}): Promise<void> => {
  const runCode = (code: string): Promise<VMExecutionResult> => {
    const vmContext = buildVMContext({ ctx, iteration, controller, onBeforeTool, onAfterTool })
    return runAsyncFunction(vmContext, code, iteration.traces, controller.signal, ctx.timeout).catch((err) => {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(getErrorMessage(err)),
        lines_executed: [],
        traces: [],
        variables: {},
      } satisfies VMExecutionResult
    })
  }

  // On streaming clients, execution starts as soon as the ■run block is fully
  // parsed — while the rest of the response (■next, stream metadata) may
  // still be streaming. Disabled when an onBeforeExecution hook is registered,
  // since the hook must run (and may mutate the code) before execution.
  const canExecuteEarly = typeof onBeforeExecution !== 'function'
  let earlyExecution: { code: string; started_at: number; promise: Promise<VMExecutionResult> } | undefined

  // ■send blocks are dispatched to the chat as soon as they are parsed — on
  // streaming clients this happens while the model is still generating.
  await generateCode({
    iteration,
    ctx,
    cognitive,
    controller,
    metadata,
    // Pre-warm the VM while the model is still writing the ■run block
    onRunStart: () => warmupVM(),
    onRunComplete: canExecuteEarly
      ? (code) => {
          if (!code.length || controller.signal.aborted || earlyExecution) {
            return
          }
          iteration.code = code
          earlyExecution = { code, started_at: Date.now(), promise: runCode(code) }
        }
      : undefined,
    onSend: async (send) => {
      if (!ctx.chat) {
        return
      }

      const sendStartedAt = Date.now()

      // Guard: models occasionally JSON-wrap long bodies ({"body": "..."});
      // unwrap before the message reaches the chat handler
      let body = send.body
      const unwrapped = body ? unwrapJsonWrappedBody(body) : undefined
      if (unwrapped !== undefined) {
        body = unwrapped
        iteration.traces.push({
          type: 'log',
          message: `Unwrapped JSON-wrapped message body (■send=${send.name})`,
          args: [],
          started_at: sendStartedAt,
          ended_at: Date.now(),
        })
      }

      const component = createJsxComponent({
        type: send.name,
        props: send.props,
        children: body ? [body] : [],
      })

      try {
        await ctx.chat.handler(component)
      } catch (err) {
        throw new Error(`Error while sending message (■send=${send.name}): ${getErrorMessage(err)}`)
      }

      iteration.traces.push({ type: 'yield', value: component, started_at: sendStartedAt, ended_at: Date.now() })
    },
    onSendDelta: ctx.chat?.onMessageDelta ? (delta) => ctx.chat!.onMessageDelta!(delta) : undefined,
  })

  if (earlyExecution) {
    // generateCode re-derives iteration.code from the full parsed response;
    // keep the code that actually ran
    iteration.code = earlyExecution.code
  }

  if (typeof onBeforeExecution === 'function') {
    try {
      const hookRes = await onBeforeExecution(iteration, controller)
      if (typeof hookRes?.code === 'string' && hookRes.code.trim().length > 0) {
        iteration.code = hookRes.code.trim()
      }
    } catch (err) {
      if (err instanceof ThinkSignal) {
        iteration.end({
          type: 'thinking_requested',
          thinking_requested: {
            variables: err.context,
            reason: err.reason,
          },
        })
        return
      }

      iteration.end({
        type: 'execution_error',
        execution_error: {
          message: `Error in onBeforeExecution hook: ${getErrorMessage(err)}`,
          stack: cleanStackTrace(
            err instanceof Error ? (err.stack ?? 'No stack trace available') : 'No stack trace available'
          ),
        },
      })
      return
    }
  }

  const traces = iteration.traces

  if (controller.signal.aborted) {
    traces.push({
      type: 'abort_signal',
      started_at: Date.now(),
      reason: 'The operation was aborted by user.',
    })

    iteration.end({
      type: 'aborted',
      aborted: {
        reason: controller.signal.reason ?? 'The operation was aborted',
      },
    })
    return
  }

  if (!iteration.code) {
    // No ■run block: the response is messages and/or an exit
    if (iteration.next) {
      await applyNextExit({ iteration, controller, onExit })
      return
    }

    if (ctx.chat && iteration.sends?.length) {
      // Message-only response in chat mode: hand the turn back to the user
      iteration.next = { name: 'listen', props: {} }
      await applyNextExit({ iteration, controller, onExit })
      return
    }

    iteration.end({
      type: 'invalid_code_error',
      invalid_code_error: {
        message:
          'The response did not include a ■run block or a ■next exit. Reply using ■ blocks and end your response with ■run or ■next=<exit>.',
      },
    })
    return
  }

  const startedAt = earlyExecution?.started_at ?? Date.now()
  const result: VMExecutionResult = earlyExecution ? await earlyExecution.promise : await runCode(iteration.code ?? '')

  await interpretVMResult({
    iteration,
    result,
    controller,
    startedAt,
    onExit,
  })
}
