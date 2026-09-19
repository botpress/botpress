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
import { previewExecutionValue, renderExecutionReport } from './execution-report.js'
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
  memoryCommitted: boolean
  memoryOutcomePending?: boolean
  activeCallId?: string
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
  const iteration = await ctx.nextIteration()
  const state: IterationExecution = {
    ...execution,
    iteration,
    inspectionValues: new InspectionValues(),
    memoryCommitted: false,
  }
  const unsubscribe = iteration.traces.onPush((traces) => {
    for (const trace of traces) {
      try {
        props.onTrace?.({ trace, iteration: ctx.iterations.length, controller })
      } catch {
        // Trace observers must not change the result of a completed action.
      }
    }
  })

  try {
    await executeIteration(state)
  } catch (error) {
    handleIterationFailure(state, error)
  } finally {
    try {
      if (!state.memoryCommitted) {
        commitMemory(state)
      }

      if (state.memoryOutcomePending) {
        state.memoryOutcomePending = false

        try {
          ctx.session.memory.updateOutcome(iteration.id, iteration.status.type, iteration.error ?? undefined)
          iteration.variables = ctx.session.memory.getBindings()
        } catch (error) {
          state.terminalError = error
        }
      }

      ctx.session.settleIteration(iteration.id)

      await finalizeIteration({ iteration, controller, onIterationEnd: props.onIterationEnd })
    } finally {
      unsubscribe()
    }
  }

  return getIterationResult(state)
}

async function executeIteration(state: IterationExecution): Promise<void> {
  const { ctx, props, iteration, cognitive, controller } = state
  iteration.initialMessages = structuredClone(iteration.messages)
  const overrides = await props.onIterationStart?.(iteration, controller, ctx)
  if (overrides) {
    Object.assign(iteration, overrides)
  }

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
      onToolCalls: (calls) => {
        // Without a preview consumer, accepted assistant text must be delivered
        // before its accompanying program starts.
        if (ctx.chat && !iteration.response?.onDelta) {
          return false
        }

        const validation = validateNativeToolCalls(calls, iteration.nativeTools!)
        const call = validation.valid ? validation.calls[0] : undefined

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

    const validation = validateNativeToolCalls(generated.toolCalls, iteration.nativeTools!)
    ctx.session.appendAssistant(iteration.id, generated)
    assistantCommitted = true

    if (!validation.valid) {
      await rejectNativeBatch(state, generated, validation.errors)
      return
    }

    await deliverAssistantText(state, generated)

    const call = validation.calls[0]
    if (call) {
      execution ??= startJavaScriptCall(state, call)
      await settleJavaScriptCall(state, execution)
      state.activeCallId = undefined
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
  const message = `Native tool batch rejected before execution: ${previewExecutionValue(errors, 500)}`
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
  iteration.traces.push({
    type: 'yield',
    value: message,
    started_at: startedAt,
    ended_at: Date.now(),
  })
}

function startJavaScriptCall(state: IterationExecution, call: ValidatedNativeCall): JavaScriptExecution {
  const { iteration, controller } = state
  iteration.code = call.code
  iteration.nativeCallId = call.id
  state.activeCallId = call.id

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
  const { ctx, iteration, controller } = state
  const { call, api } = execution
  const result = await execution.result
  const outcome =
    result.success && !result.signal ? (api.getTerminalOutcome() ?? api.resolve(result.return_value)) : undefined

  removeCapturedDecisions(result, api)

  if (outcome?.type === 'inspect' && result.success) {
    result.return_value = outcome.value
  }

  if (outcome?.type === 'exit') {
    await completeJavaScriptExit(state, result, outcome, call.code)
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
  const report = commitMemory(state, result)

  ctx.session.appendToolResult(
    iteration.id,
    call.id,
    renderExecutionReport(iteration, result, report, {
      requestedCode: call.code,
      inspected: outcome?.type === 'inspect',
      maxTokens: ctx.toolResultMaxTokens,
      inspectionValue:
        result.success && report.resultAvailable ? state.inspectionValues.prepare(result.return_value) : undefined,
    })
  )
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

  if (state.memoryCommitted) {
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
  const report = commitMemory(state, interrupted)

  ctx.session.appendToolResult(
    iteration.id,
    execution.call.id,
    renderExecutionReport(iteration, interrupted, report, {
      requestedCode: execution.call.code,
      maxTokens: ctx.toolResultMaxTokens,
    })
  )
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
  outcome: Extract<JavaScriptOutcome, { type: 'exit' }>,
  requestedCode: string
): Promise<void> {
  const { ctx, iteration, controller, props } = state
  const report = commitMemory(state, result, false)

  try {
    controller.signal.throwIfAborted()
    await applyNativeExit(iteration, outcome.exit, outcome.value, controller, props.onExit)
  } catch (error) {
    endFailedIteration(iteration, controller, error)
  }

  ctx.session.appendToolResult(
    iteration.id,
    iteration.nativeCallId!,
    renderExecutionReport(iteration, result, report, { requestedCode, maxTokens: ctx.toolResultMaxTokens })
  )
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

      const component = iteration.components.find((candidate) => candidate.definition.name === message.component.name)

      if (!component?.handler) {
        throw new Error(`Component "${message.component.name}" has no registered handler.`)
      }

      await component.handler(message.component.props, { iterationId: iteration.id, id: message.id })
    } catch (error) {
      iteration.traces.push({
        type: 'yield',
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

    iteration.traces.push({
      type: 'yield',
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
      ctx.session.appendContext(previewExecutionValue(iteration.error ?? 'Completion rejected.', 200))
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
  const report = ctx.session.memory.commit({
    ...iteration.sessionInfo!,
    timestamp: Date.now(),
    outcome: iteration.status.type,
    error: iteration.error ?? undefined,
    variables: result?.variables,
    variableWrites: result?.variableWrites,
    captureErrors: result?.captureErrors,
    hasResult: includeReturn && !!result?.success && !result.signal && !controller.signal.aborted,
    result: result?.success ? result.return_value : undefined,
  })
  state.memoryCommitted = true
  state.memoryOutcomePending = iteration.status.type === 'pending'

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

  iteration.variables = ctx.session.memory.getBindings()
  return report
}

function handleIterationFailure(state: IterationExecution, error: unknown): void {
  const { ctx, iteration, controller } = state
  if (iteration.status.type === 'pending') {
    endFailedIteration(iteration, controller, error)
  }

  if (error instanceof MemoryCapacityError) {
    // Capacity failure can happen after an action. Never retry settlement or
    // generate another instruction that could repeat that action.
    state.memoryCommitted = true
  }

  // Keep earlier successful results. Failed and unexecuted calls each receive
  // a matching result, so the next model request cannot replay a partial batch.
  const pending = ctx.session.pendingCalls.filter((call) => call.iterationId === iteration.id)
  for (const call of pending) {
    const outcome =
      call.callId === state.activeCallId
        ? 'This call failed without a confirmed successful result; its external effects may be incomplete.'
        : 'This call was skipped and did not run.'
    ctx.session.appendToolResult(
      iteration.id,
      call.callId,
      `Execution stopped: ${previewExecutionValue(getErrorMessage(error), 200)}. ${outcome} Earlier acknowledged calls remain completed.`
    )
  }

  if (error instanceof CognitiveError || error instanceof MemoryCapacityError || controller.signal.aborted) {
    state.terminalError = controller.signal.aborted ? (controller.signal.reason ?? error) : error
    return
  }

  ctx.session.appendContext(
    `Execution stopped: ${previewExecutionValue(getErrorMessage(error), 200)}. Continue using the retained state.`
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
      onYield: (component, metadata) => api.sendComponent(component, metadata),
      javascriptApi: api,
    })
    result = await runAsyncFunction(
      vmContext,
      code,
      iteration.traces,
      controller.signal,
      ctx.timeout,
      Object.keys(ctx.session.memory.variables)
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

  iteration.traces.push({
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
