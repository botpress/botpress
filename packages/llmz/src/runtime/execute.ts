import { Client } from '@botpress/client'
import { Cognitive, CognitiveBeta, cognitiveFromBeta, type BotpressClientLike } from '@botpress/cognitive'

import { createJoinedAbortController } from '../abort-signal.js'
import { Context, Iteration } from '../context.js'
import { CognitiveError, LoopExceededError, ThinkSignal } from '../errors.js'
import { ErrorExecutionResult, ExecutionResult, PartialExecutionResult, SuccessExecutionResult } from '../result.js'
import { Snapshot } from '../snapshots.js'
import { cleanStackTrace } from '../stack-traces.js'
import { VMExecutionResult } from '../types.js'
import { getErrorMessage, init } from '../utils.js'
import { runAsyncFunction } from '../vm/index.js'
import { generateCode } from './generate.js'
import { interpretVMResult } from './interpret-result.js'
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

  const cognitive = Cognitive.isCognitiveClient(client)
    ? client
    : CognitiveBeta.isBetaClient(client)
      ? cognitiveFromBeta(client)
      : new Cognitive({ client: client as BotpressClientLike, __experimental_beta: true })

  const ctx = new Context({
    chat: props.chat,
    instructions: props.instructions,
    objects: props.objects,
    tools: props.tools,
    loop: props.options?.loop,
    timeout: props.options?.timeout,
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
          onTrace?.({ trace, iteration: ctx.iterations.length })
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

        const executionResult = await executeIterationWithErrorHandling({
          iteration,
          ctx,
          cognitive,
          controller,
          onExit,
          onBeforeExecution,
          onAfterTool,
          onBeforeTool,
          onIterationEnd,
        })
        if (executionResult.type === 'return') {
          return executionResult.result
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
}: {
  ctx: Context
  iteration: Iteration
  cognitive: RuntimeCognitive
  controller: AbortController
  onExit?: ExecutionHooks['onExit']
  onBeforeExecution?: ExecutionHooks['onBeforeExecution']
  onBeforeTool?: ExecutionHooks['onBeforeTool']
  onAfterTool?: ExecutionHooks['onAfterTool']
}): Promise<void> => {
  await generateCode({ iteration, ctx, cognitive, controller })

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
  const vmContext = buildVMContext({ ctx, iteration, controller, onBeforeTool, onAfterTool })

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

  const startedAt = Date.now()
  const result: VMExecutionResult = await runAsyncFunction(
    vmContext,
    iteration.code ?? '',
    traces,
    controller.signal,
    ctx.timeout
  ).catch((err) => {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(getErrorMessage(err)),
      lines_executed: [],
      traces: [],
      variables: {},
    } satisfies VMExecutionResult
  })

  await interpretVMResult({
    iteration,
    result,
    controller,
    startedAt,
    onExit,
  })
}
