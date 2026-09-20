import { Client } from '@botpress/client'
import { Cognitive, type BotpressClientLike } from '@botpress/cognitive'

import { createJoinedAbortController } from '../abort-signal.js'
import type { AssistantTextMessage } from '../chat.js'
import { compile } from '../compiler/index.js'
import { isAnyComponent } from '../component.js'
import { Context, Iteration, ListenExit } from '../context.js'
import { _CustomModelClient } from '../custom-client.js'
import { CodeExecutionError, CognitiveError, InvalidCodeError, LoopExceededError, ThinkSignal } from '../errors.js'
import type { Exit } from '../exit.js'
import { MemoryCapacityError, type MemoryReport } from '../memory.js'
import { ErrorExecutionResult, ExecutionResult, SuccessExecutionResult } from '../result.js'
import { cleanStackTrace } from '../stack-traces.js'
import type { VMExecutionResult } from '../types.js'
import { getErrorMessage, init } from '../utils.js'
import { runAsyncFunction } from '../vm/index.js'
import { getExecutionActivity } from './execution-activity.js'
import { renderExecutionReport, type ExecutionOutcome } from './execution-report.js'
import { generateCode, type NativeGeneration } from './generate.js'
import { InspectionValues } from './inspection-values.js'
import {
  createJavaScriptApi,
  type JavaScriptApi,
  type JavaScriptOutcome,
  type PreparedMessage,
} from './javascript-api.js'
import { validateNativeToolCalls, type ValidatedNativeCall } from './native-tools.js'
import type { ExecutionHooks, ExecutionProps, RuntimeCognitive } from './types.js'
import { finalizeIteration } from './utils.js'
import { buildVMContext } from './vm-context.js'

type Execution = {
  ctx: Context
  props: ExecutionProps
  cognitive: RuntimeCognitive
  controller: AbortController
}

type IterationExecution = Execution & {
  iteration: Iteration
  inspectionValues: InspectionValues
  capture?: {
    call: ValidatedNativeCall
    result: VMExecutionResult
    inspected: boolean
    interrupted?: boolean
  }
  memory?: MemoryReport
  terminalError?: unknown
}

type JavaScriptExecution = {
  call: ValidatedNativeCall
  api: JavaScriptApi
  result: Promise<VMExecutionResult>
}

/** Each iteration joins generation and execution before settling its transcript. */
export async function executeContext(props: ExecutionProps): Promise<ExecutionResult> {
  await init()
  const result = await executeContextInternal(props)

  try {
    await result.context.chat?.onExecutionDone?.(result)
  } catch {
    // Observational hooks cannot replace the completed execution result.
  }

  return result
}

async function executeContextInternal(props: ExecutionProps): Promise<ExecutionResult> {
  const controller = createJoinedAbortController([props.signal])
  const ctx = new Context({
    ...props,
    loop: props.options?.loop,
    timeout: props.options?.timeout,
    maxTokens: props.options?.maxTokens,
    toolResultMaxTokens: props.options?.toolResultMaxTokens,
    maxTimeToFirstToken: props.options?.maxTimeToFirstToken,
    midStreamFallback: props.options?.midStreamFallback,
    transcriptionModel: props.options?.transcriptionModel,
  })
  let release: (() => void) | undefined

  try {
    if ('snapshot' in props) {
      throw new Error(
        'Snapshots and external pause/resume are no longer supported. Use a session for conversation history and memory.'
      )
    }

    if ('messages' in props) {
      throw new Error(
        'Append input with session.append(message) before calling execute(). execute.messages is no longer supported.'
      )
    }

    release = ctx.session.acquire()
    prepareSession(ctx)

    const client = props.client ?? new Client()
    const cognitive: RuntimeCognitive =
      Cognitive.isCognitiveClient(client) || _CustomModelClient.isCustomClient(client)
        ? client
        : new Cognitive({ client: client as BotpressClientLike })
    const execution: Execution = { ctx, props, cognitive, controller }

    while (ctx.iterations.length < ctx.loop) {
      const result = await executeNextIteration(execution)
      if (result) {
        if (result.isSuccess()) {
          ctx.session.completeTurn()
        }

        return result
      }
    }

    return new ErrorExecutionResult(ctx, new LoopExceededError())
  } catch (error) {
    return new ErrorExecutionResult(ctx, error)
  } finally {
    release?.()
  }
}

function prepareSession(ctx: Context): void {
  if (ctx.chat && ctx.session.turn > 0 && !ctx.session.hasActiveTurn && !ctx.session.pendingMessages.length) {
    throw new Error('No pending input. Append a message to the session before starting another chat turn.')
  }

  ctx.session.beginTurn()
}

async function executeNextIteration(execution: Execution): Promise<ExecutionResult | undefined> {
  const { ctx, props, controller } = execution
  let onTrace = props.onTrace
  const iterationNumber = ctx.iterations.length + 1
  const iteration = await ctx.nextIteration((trace) => {
    onTrace?.({ trace, iteration: iterationNumber, controller })
  })
  const state: IterationExecution = {
    ...execution,
    iteration,
    inspectionValues: new InspectionValues(),
  }

  try {
    await executeIteration(state)
  } catch (error) {
    handleIterationFailure(state, error)
  } finally {
    try {
      try {
        state.memory ??= commitMemory(state, state.capture?.result)
      } catch (error) {
        failFinalization(state, error)
      }

      const memory = state.memory!
      const outcome = getExecutionOutcome(state, memory)

      if (state.capture) {
        ctx.session.appendToolResult(
          iteration.id,
          state.capture.call.id,
          renderExecutionReport({
            outcome,
            memory,
            activity: getExecutionActivity(iteration),
            source: { requested: state.capture.call.code, executed: iteration.code },
            requiresExit: !iteration.isChatEnabled,
            identity: {
              sessionId: ctx.session.id,
              ...iteration.sessionInfo,
              iterationId: iteration.id,
              iteration: iteration.sessionInfo?.number,
            },
            inspector: ctx.inspector,
            maxTokens: ctx.toolResultMaxTokens,
            policies: state.inspectionValues.getPolicy,
          })
        )
      }

      try {
        ctx.session.settleIteration(iteration.id, {
          outcome: iteration.status.type,
          error: iteration.error ?? undefined,
        })
      } catch (error) {
        if (!(error instanceof MemoryCapacityError)) {
          throw error
        }

        // Retained values are already within the limit. Keep their receipt while
        // reporting the oversized diagnostic through the execution result.
        failFinalization(state, error)
        ctx.session.settleIteration(iteration.id, { outcome: 'error' })
      }

      await finalizeIteration({ iteration, controller, onIterationEnd: props.onIterationEnd })
    } finally {
      onTrace = undefined
    }
  }

  return getIterationResult(state)
}

async function executeIteration(state: IterationExecution): Promise<void> {
  const { ctx, props, iteration, cognitive, controller } = state
  await props.onIterationStart?.(iteration, controller, ctx)

  controller.signal.throwIfAborted()
  let execution: JavaScriptExecution | undefined
  let assistantCommitted = false

  try {
    const generated = await generateCode({
      iteration,
      ctx,
      cognitive,
      controller,
      metadata: props.metadata,
      onSendDelta: iteration.response?.onDelta,
      onBeforeRequest: props.onBeforeRequest,
      onToolCalls: (calls) => {
        // Without a preview consumer, accepted assistant text must be delivered
        // before its accompanying program starts.
        if (ctx.chat && !iteration.response?.onDelta) {
          return false
        }

        const validation = validateNativeToolCalls(calls)
        const call = validation.valid ? validation.call : undefined

        if (!call) {
          return false
        }

        // A completed call may arrive before the response stream closes.
        // Its identity must be checked before starting any host effects.
        if (ctx.session.messages.some((message) => message.toolCalls?.some((previous) => previous.id === call.id))) {
          throw new CognitiveError('Native call IDs must be unique in retained session history.')
        }

        execution = startJavaScriptCall(state, call)
        return true
      },
    })

    // The stream is drained; execution may still be waiting on business tools.
    await execution?.result
    controller.signal.throwIfAborted()

    const validation = validateNativeToolCalls(generated.toolCalls)
    ctx.session.appendAssistant(iteration.id, generated)
    assistantCommitted = true

    if (!validation.valid) {
      await rejectNativeBatch(state, generated, validation.errors)
      return
    }

    await deliverAssistantText(state, generated)

    const call = validation.call
    if (call) {
      execution ??= startJavaScriptCall(state, call)
      await settleJavaScriptCall(state, execution)
    }

    if (iteration.status.type === 'pending') {
      await finishNativeResponse(state, generated)
    }
  } catch (error) {
    if (execution) {
      await preserveInterruptedExecution(state, execution, error, assistantCommitted)
    }

    throw error
  }
}

async function rejectNativeBatch(
  { ctx, iteration }: IterationExecution,
  generated: NativeGeneration,
  errors: string[]
): Promise<void> {
  const message = `Native tool batch rejected before execution: ${ctx.inspector(errors, { purpose: 'error', maxTokens: 500 })}`
  for (const call of generated.toolCalls) {
    ctx.session.appendToolResult(iteration.id, call.id, message)
  }

  if (generated.output && iteration.response?.onDelta) {
    try {
      await iteration.response.onDelta({
        restart: true,
        iterationId: iteration.id,
        attempt: generated.attempt + 1,
        fromModel: generated.metadata.model ?? 'unknown',
        toModel: generated.metadata.model ?? 'unknown',
        reason: message,
      })
    } catch (error) {
      throw new CognitiveError(`Could not retract the rejected response: ${getErrorMessage(error)}`)
    }
  }

  iteration.end({
    type: 'invalid_code_error',
    invalid_code_error: { message },
  })
}

async function deliverAssistantText(state: IterationExecution, generated: NativeGeneration): Promise<void> {
  const { ctx, iteration } = state
  if (!generated.output || !ctx.chat) {
    return
  }

  const startedAt = Date.now()
  const message: AssistantTextMessage = { type: 'text', text: generated.output }

  await iteration.response?.handler?.(generated.output, generated.messageMetadata)
  iteration.recordTrace({
    type: 'message_delivery',
    value: message,
    started_at: startedAt,
    ended_at: Date.now(),
  })
}

function startJavaScriptCall(state: IterationExecution, call: ValidatedNativeCall): JavaScriptExecution {
  const { iteration, controller } = state
  iteration.code = call.code
  iteration.nativeCallId = call.id

  const api = createJavaScriptApi({
    iteration,
    components: iteration.components,
    exits: iteration.exits,
    signal: controller.signal,
    deliver: (messages) => deliverJavaScriptMessages(state, messages),
  })
  return { call, api, result: executeJavaScript(state, api) }
}

async function settleJavaScriptCall(state: IterationExecution, execution: JavaScriptExecution): Promise<void> {
  const { iteration, controller } = state
  const { call, api } = execution
  const result = await execution.result
  const outcome =
    result.success && !result.signal ? (api.getTerminalOutcome() ?? api.resolve(result.return_value)) : undefined

  removeCapturedDecisions(result, api)
  state.capture = { call, result, inspected: outcome?.type === 'inspect' }

  if (outcome?.type === 'inspect' && result.success) {
    result.return_value = outcome.value
  }

  if (outcome?.type === 'exit') {
    await completeJavaScriptExit(state, result, outcome)
    return
  }

  if (result.success && containsDecision(result.return_value, api)) {
    result.captureErrors ??= []
    result.captureErrors.push({
      name: '$return',
      reason: 'Execution decisions cannot be nested inside returned data. Use return inspect(value) with plain values.',
    })
  }

  endJavaScriptIteration(iteration, controller, result)
}

async function preserveInterruptedExecution(
  state: IterationExecution,
  execution: JavaScriptExecution,
  error: unknown,
  assistantCommitted: boolean
): Promise<void> {
  const { ctx, iteration, controller } = state
  execution.api.complete()
  const result = await execution.result

  if (state.memory) {
    return
  }

  if (!assistantCommitted) {
    ctx.session.appendAssistant(iteration.id, {
      output: '',
      toolCalls: [{ id: execution.call.id, name: 'run_javascript', input: { code: execution.call.code } }],
    })
  }

  // A stream error cannot undo business effects. Retain captured memory and
  // receipts, but never apply a terminal decision from the interrupted response.
  removeCapturedDecisions(result, execution.api)

  if (iteration.status.type === 'pending') {
    endFailedIteration(iteration, controller, error)
  }

  const interrupted = {
    ...result,
    success: false as const,
    signal: undefined,
    error: error instanceof Error ? error : new Error(getErrorMessage(error)),
    traces: [],
  }
  state.capture = { call: execution.call, result: interrupted, inspected: false, interrupted: true }
}

function removeCapturedDecisions(result: VMExecutionResult, api: JavaScriptApi): void {
  for (const [name, value] of Object.entries(result.variables)) {
    if (containsDecision(value, api)) {
      delete result.variables[name]
      result.captureErrors ??= []
      result.captureErrors.push({ name, reason: 'Execution decisions cannot be retained as memory variables.' })
    }
  }
}

function containsDecision(value: unknown, api: JavaScriptApi, seen = new Set<object>()): boolean {
  if (api.isReceipt(value)) {
    return true
  }

  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return false
  }

  seen.add(value)

  return Object.values(value).some((nested) => containsDecision(nested, api, seen))
}

async function completeJavaScriptExit(
  state: IterationExecution,
  result: VMExecutionResult,
  outcome: Extract<JavaScriptOutcome, { type: 'exit' }>
): Promise<void> {
  const { iteration, controller, props } = state
  state.memory = commitMemory(state, result, false)

  try {
    controller.signal.throwIfAborted()
    await applyNativeExit(iteration, outcome.exit, outcome.value, controller, props.onExit)
  } catch (error) {
    endFailedIteration(iteration, controller, error)
  }
}

async function deliverJavaScriptMessages(
  { ctx, iteration, controller }: IterationExecution,
  messages: readonly PreparedMessage[]
): Promise<void> {
  if (!messages.length) {
    return
  }

  if (!ctx.chat) {
    throw new Error('Component delivery requires chat mode.')
  }

  for (const message of messages) {
    controller.signal.throwIfAborted()
    const startedAt = Date.now()

    try {
      if (!isAnyComponent(message.component)) {
        throw new Error('Only registered rich components can be delivered from JavaScript.')
      }

      const component = iteration.components.get(message.component.name)

      if (!component?.handler) {
        throw new Error(`Component "${message.component.name}" has no registered handler.`)
      }

      await component.handler(message.component.props, { iterationId: iteration.id, id: message.id })
    } catch (error) {
      iteration.recordTrace({
        type: 'message_delivery',
        value: message.component,
        message_id: message.id,
        native_call_id: iteration.nativeCallId,
        success: false,
        error: getErrorMessage(error),
        started_at: startedAt,
        ended_at: Date.now(),
      })

      throw new Error(
        `Delivery ${message.id} failed: ${getErrorMessage(error)}. Its external outcome is uncertain. Later messages were skipped; earlier acknowledged messages remain delivered.`
      )
    }

    iteration.recordTrace({
      type: 'message_delivery',
      value: message.component,
      message_id: message.id,
      native_call_id: iteration.nativeCallId,
      success: true,
      started_at: startedAt,
      ended_at: Date.now(),
    })
  }
}

async function finishNativeResponse(state: IterationExecution, generated: NativeGeneration): Promise<void> {
  const { ctx, iteration, controller, props } = state
  if (!generated.toolCalls.length && generated.output.trim() && ctx.chat) {
    await applyNativeExit(iteration, ListenExit, {}, controller, props.onExit)
    if (!iteration.hasExited()) {
      ctx.session.appendContext(
        ctx.inspector(iteration.error ?? 'Completion rejected.', { purpose: 'error', maxTokens: 200 })
      )
    }

    return
  }

  let reason = iteration.exits.length
    ? 'This is a worker task. Every run_javascript program must explicitly return inspect(value) or return exit(name, payload) with a registered name and a valid payload. Assistant prose alone does not complete the task.'
    : 'Every run_javascript program must explicitly return inspect(value). To see a business tool result in the next response, return inspect(result).'

  if (ctx.chat) {
    reason = generated.toolCalls.length
      ? 'Every run_javascript program must explicitly return inspect(value) or return exit(name, payload). Use return exit("listen") to wait for the user.'
      : 'Reply with assistant text, or use run_javascript with an explicit return inspect(value) or return exit(name, payload). Use return exit("listen") to wait for the user.'
  }

  iteration.end({
    type: 'thinking_requested',
    thinking_requested: { reason, variables: {} },
  })

  if (!generated.toolCalls.length) {
    ctx.session.appendContext(reason)
  }
}

function commitMemory(state: IterationExecution, result?: VMExecutionResult, includeReturn = true): MemoryReport {
  const { ctx, iteration, controller } = state
  const report = ctx.session.commitIteration({
    ...iteration.sessionInfo!,
    timestamp: Date.now(),
    variables: result?.variables,
    variableWrites: result?.variableWrites,
    captureErrors: result?.captureErrors,
    hasResult: includeReturn && !!result?.success && !result.signal && !controller.signal.aborted,
    result: result?.success ? result.return_value : undefined,
  })

  state.memory = report

  for (const mutation of iteration.mutations) {
    const trace = [...iteration.traces]
      .reverse()
      .find(
        (trace) => trace.type === 'property' && trace.object === mutation.object && trace.property === mutation.property
      )
    const changes = ctx.session.memory.recordObjectMutations([mutation], {
      ...iteration.sessionInfo!,
      timestamp: trace?.started_at ?? Date.now(),
    })
    report.updated.push(...changes)
  }

  return report
}

function failFinalization(state: IterationExecution, error: unknown): void {
  const { iteration } = state
  // JavaScript may already have ended successfully. A later retention failure
  // changes the final execution outcome, while preserving its completed effects.
  iteration.status = {
    type: 'execution_error',
    execution_error: { message: getErrorMessage(error), stack: executionErrorStack(error) },
  }
  iteration.ended_ts = Date.now()
  state.terminalError = error
  state.memory ??= { created: [], updated: [], unavailable: [], resultAvailable: false }
}

function getExecutionOutcome(state: IterationExecution, memory: MemoryReport): ExecutionOutcome {
  const { iteration, capture } = state
  const status = iteration.status

  if (status.type === 'aborted') {
    return { type: 'cancelled', message: status.aborted.reason }
  }

  if (capture?.interrupted) {
    return { type: 'interrupted', reason: 'stream', message: iteration.error ?? undefined }
  }

  if (status.type === 'exit_success') {
    return { type: 'exit', name: status.exit_success.exit_name, value: status.exit_success.return_value }
  }

  if (status.type === 'exit_error') {
    return { type: 'error', exitName: status.exit_error.exit, message: status.exit_error.message }
  }

  if (status.type === 'thinking_requested') {
    const thinking = status.thinking_requested

    if (thinking.interrupted) {
      return { type: 'interrupted', reason: 'thinking', message: thinking.reason, context: thinking.variables }
    }

    return {
      type: 'inspect',
      value: capture?.result.success ? capture.result.return_value : undefined,
      available: memory.resultAvailable,
      explicit: capture?.inspected ?? false,
    }
  }

  return { type: 'error', message: iteration.error ?? 'Execution failed.', error: capture?.result.error }
}

function handleIterationFailure(state: IterationExecution, error: unknown): void {
  const { ctx, iteration, controller } = state
  if (iteration.status.type === 'pending') {
    endFailedIteration(iteration, controller, error)
  }

  if (error instanceof MemoryCapacityError) {
    // Capacity failure can happen after an action. Never retry settlement or
    // generate another instruction that could repeat that action.
    state.memory ??= { created: [], updated: [], unavailable: [], resultAvailable: false }
  }

  // Keep earlier successful results. Failed and unexecuted calls each receive
  // a matching result, so the next model request cannot replay a partial batch.
  const pending = ctx.session.pendingCalls.filter((call) => call.iterationId === iteration.id)
  for (const call of pending) {
    if (call.callId === state.capture?.call.id) {
      continue
    }

    const outcome =
      call.callId === iteration.nativeCallId
        ? 'This call failed without a confirmed successful result; its external effects may be incomplete.'
        : 'This call was skipped and did not run.'
    ctx.session.appendToolResult(
      iteration.id,
      call.callId,
      `Execution stopped: ${ctx.inspector(getErrorMessage(error), { purpose: 'error', maxTokens: 200 })}. ${outcome} Earlier acknowledged calls remain completed.`
    )
  }

  if (error instanceof CognitiveError || error instanceof MemoryCapacityError || controller.signal.aborted) {
    state.terminalError = controller.signal.aborted ? (controller.signal.reason ?? error) : error
    return
  }

  if (ctx.session.pendingCalls.length) {
    return
  }

  ctx.session.appendContext(
    `Execution stopped: ${ctx.inspector(getErrorMessage(error), { purpose: 'error', maxTokens: 200 })}. Continue using the retained state.`
  )
}

function endFailedIteration(iteration: Iteration, controller: AbortController, error: unknown): void {
  if (controller.signal.aborted) {
    iteration.end({
      type: 'aborted',
      aborted: { reason: getErrorMessage(controller.signal.reason ?? error) },
    })
    return
  }

  if (error instanceof CognitiveError) {
    iteration.end({
      type: 'generation_error',
      generation_error: { message: error.message },
    })
    return
  }

  if (error instanceof ThinkSignal) {
    iteration.end({
      type: 'thinking_requested',
      thinking_requested: { reason: error.reason, variables: error.context, interrupted: true },
    })
    return
  }

  iteration.end({
    type: 'execution_error',
    execution_error: {
      message: getErrorMessage(error),
      stack: executionErrorStack(error),
    },
  })
}

function executionErrorStack(error: unknown): string {
  if (error instanceof CodeExecutionError && error.stacktrace) {
    return cleanStackTrace(error.stacktrace)
  }

  if (error instanceof Error) {
    return cleanStackTrace(error.stack ?? '')
  }

  return ''
}

function getIterationResult(state: IterationExecution): ExecutionResult | undefined {
  const { ctx, iteration } = state
  if (state.terminalError !== undefined) {
    return new ErrorExecutionResult(ctx, state.terminalError)
  }

  if (iteration.status.type === 'exit_success') {
    const outcome = iteration.status.exit_success
    return new SuccessExecutionResult(ctx, {
      exit: iteration.exits.find((exit) => exit.name === outcome.exit_name)!,
      result: outcome.return_value,
    })
  }

  if (iteration.status.type === 'aborted') {
    return new ErrorExecutionResult(ctx, iteration.error)
  }

  return undefined
}

async function applyNativeExit(
  iteration: Iteration,
  exit: Exit,
  value: unknown,
  controller: AbortController,
  onExit?: ExecutionHooks['onExit']
): Promise<void> {
  try {
    await onExit?.({ exit, result: value }, controller)
    controller.signal.throwIfAborted()
    iteration.end({
      type: 'exit_success',
      exit_success: { exit_name: exit.name, return_value: value },
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw error
    }

    iteration.end({
      type: 'exit_error',
      exit_error: { exit: exit.name, message: getErrorMessage(error), return_value: value },
    })
  }
}

async function executeJavaScript(state: IterationExecution, api: JavaScriptApi): Promise<VMExecutionResult> {
  const { iteration, ctx, controller, props } = state
  const startedAt = Date.now()
  let result: VMExecutionResult

  try {
    const override = await props.onBeforeExecution?.(iteration, controller)
    if (typeof override?.code === 'string') {
      iteration.code = override.code
    }

    controller.signal.throwIfAborted()

    const code = iteration.code!
    ctx.session.memory.assertNamesAvailable(compile(code).variables)
    const vmContext = buildVMContext({
      ctx,
      iteration,
      controller,
      onBeforeTool: props.onBeforeTool,
      onAfterTool: props.onAfterTool,
      onTruncation: (value, policy) => state.inspectionValues.capture(value, policy),
      onToolResult: (value) => state.inspectionValues.captureDefault(value, ctx.toolResultMaxTokens),
      javascriptApi: api,
    })
    result = await runAsyncFunction(
      vmContext,
      code,
      iteration.traces,
      controller.signal,
      ctx.timeout,
      Object.keys(ctx.session.memory.variables),
      iteration.recordTrace
    )
  } catch (error) {
    result = interruptedVMResult(error)
  }

  try {
    await api.close()
  } catch (error) {
    result = {
      ...result,
      success: !!result.signal,
      error: error instanceof Error ? error : new Error(getErrorMessage(error)),
      traces: [],
    }
  }

  const interruption = api.getInterruption()

  if (interruption && !result.signal) {
    // Observe a thinking interruption from work that settled after the program returned.
    interruption.variables = result.variables
    result = {
      ...result,
      success: true,
      signal: interruption,
      error: undefined,
      return_value: undefined,
    }
  }

  iteration.recordTrace({
    type: 'code_execution',
    lines_executed: result.lines_executed,
    started_at: startedAt,
    ended_at: Date.now(),
  })
  return result
}

function interruptedVMResult(error: unknown): VMExecutionResult {
  if (error instanceof ThinkSignal) {
    return {
      success: true,
      signal: error,
      return_value: undefined,
      variables: {},
      lines_executed: [],
    }
  }

  return {
    success: false,
    error: error instanceof Error ? error : new Error(getErrorMessage(error)),
    variables: {},
    lines_executed: [],
    traces: [],
  }
}

function endJavaScriptIteration(iteration: Iteration, controller: AbortController, result: VMExecutionResult): void {
  if (controller.signal.aborted) {
    endFailedIteration(iteration, controller, controller.signal.reason)
    return
  }

  if (!result.success) {
    if (result.error instanceof InvalidCodeError) {
      iteration.end({
        type: 'invalid_code_error',
        invalid_code_error: { message: result.error.message },
      })
    } else {
      endFailedIteration(iteration, controller, result.error)
    }

    return
  }

  if (result.signal instanceof ThinkSignal) {
    iteration.end({
      type: 'thinking_requested',
      thinking_requested: {
        reason: result.signal.reason,
        variables: result.signal.context,
        metadata: result.signal.metadata,
        interrupted: true,
      },
    })
    return
  }

  iteration.end({
    type: 'thinking_requested',
    thinking_requested: {
      reason: 'JavaScript completed. Inspect the return value and memory changes.',
      variables: {},
    },
  })
}
