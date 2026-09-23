import type {
  CognitiveMessage,
  CognitiveMetadata,
  CognitiveResponse,
  CognitiveStreamChunk,
  CognitiveToolCall,
} from '@botpress/cognitive'
import { createJoinedAbortController } from '../abort-signal.js'
import type { MessageDelta, MessageMetadata } from '../chat/chat.js'
import type { Context, ContextTokens, Iteration } from '../context.js'
import { callHook } from '../errors/hooks.js'
import { CognitiveError, isLLMzError, TokenOverflowError } from '../errors.js'
import { getReasoningHint } from '../prompts/reasoning.js'

import { prepareAutoCompaction } from '../session/compactor.js'
import { stableJSON } from '../session/json.js'
import type { Transcript } from '../session/transcript.js'
import { getErrorMessage } from '../utils.js'
import { getRunJavaScriptTool, WORKER_RESPONSE_INSTRUCTION } from './native-tools.js'
import { countNativeRequestTokens, resolveTokenBudget } from './token-budget.js'
import type { ExecutionHooks, RuntimeCognitive } from './types.js'

export { countNativeRequestTokens } from './token-budget.js'

/** A custom provider adapter can return the full assistant message, including opaque continuation data. */
export type NativeResponse = CognitiveResponse & {
  assistantMessage?: CognitiveMessage
  continuation?: unknown
}

type NativeChunk = CognitiveStreamChunk & {
  assistantMessage?: CognitiveMessage
  continuation?: unknown
}

export type NativeGeneration = {
  attempt: number
  output: string
  toolCalls: CognitiveToolCall[]
  assistantMessage?: CognitiveMessage
  continuation?: unknown
  metadata: CognitiveMetadata
  messageMetadata: MessageMetadata
}

const STREAM_IDLE_TIMEOUT = 180_000
const STATIC_TOKEN_PARTS = ['instructions', 'tools', 'protocol'] as const
type StaticTokenPart = (typeof STATIC_TOKEN_PARTS)[number]

const staticTokenEstimates = new WeakMap<Iteration, Pick<ContextTokens, StaticTokenPart>>()

function assertSuccessfulGeneration(metadata: CognitiveMetadata | undefined) {
  if (!metadata || metadata.provider === 'unknown') {
    throw new CognitiveError('LLM generation failed: missing successful provider metadata')
  }

  if (metadata.stopReason === 'max_tokens') {
    throw new TokenOverflowError(
      'LLM generation did not complete: stopReason=max_tokens',
      metadata.usage?.outputTokens,
      undefined,
      'output'
    )
  }

  if (metadata.stopReason === 'content_filter' || metadata.stopReason === 'other') {
    throw new CognitiveError(`LLM generation did not complete: stopReason=${metadata.stopReason}`)
  }
}

function measureNativeContextTokens(
  iteration: Iteration,
  messages: CognitiveMessage[],
  tools: unknown,
  total: number
): ContextTokens {
  let estimates = staticTokenEstimates.get(iteration)

  if (!estimates) {
    const initial = iteration.tokens?.context
    estimates = {
      instructions: initial?.instructions ?? 0,
      tools: initial?.tools ?? 0,
      protocol: initial?.protocol ?? 0,
    }
    staticTokenEstimates.set(iteration, estimates)
  }

  const history = messages.filter((message) => message.role !== 'system')
  const emptyRequestTokens = countNativeRequestTokens([], [])
  const requestWithToolsTokens = countNativeRequestTokens([], tools)
  const requestWithHistoryTokens = countNativeRequestTokens(history, tools)
  const structuralTokens = Math.min(total, emptyRequestTokens)
  const schemaTokens = Math.min(total - structuralTokens, Math.max(0, requestWithToolsTokens - emptyRequestTokens))
  const iterations = Math.min(
    total - structuralTokens - schemaTokens,
    Math.max(0, requestWithHistoryTokens - requestWithToolsTokens)
  )
  const systemBudget = total - structuralTokens - schemaTokens - iterations
  const estimatedSystemParts = STATIC_TOKEN_PARTS.reduce((sum, part) => sum + estimates[part], 0)
  const scale = estimatedSystemParts > 0 ? Math.min(1, systemBudget / estimatedSystemParts) : 0
  const instructions = Math.floor(estimates.instructions * scale)
  const toolsTokens = Math.floor(estimates.tools * scale) + schemaTokens
  const protocol = Math.floor(estimates.protocol * scale)

  // Tokenization is not additive across JSON boundaries. Marginal request sizes
  // keep native history and schemas current; the residual includes scaffolding.
  return {
    total,
    framework: total - instructions - toolsTokens - protocol - iterations,
    instructions,
    tools: toolsTokens,
    protocol,
    iterations,
  }
}

/** A client may ignore its AbortSignal; cancellation must still release LLMz. */
function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(signal.reason ?? new Error('Generation aborted'))

    // The provider can synchronously abort while constructing its rejected
    // promise. Observe that rejection before checking the signal's current state.
    operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted))

    if (signal.aborted) {
      aborted()
      return
    }

    signal.addEventListener('abort', aborted, { once: true })
  })
}

function validateResponse(
  output: unknown,
  calls: unknown,
  assistant?: CognitiveMessage
): asserts calls is CognitiveToolCall[] {
  if (typeof output !== 'string') {
    throw new CognitiveError('Provider returned invalid assistant output')
  }

  if (!Array.isArray(calls)) {
    throw new CognitiveError('Provider returned invalid native tool calls')
  }

  const ids = new Set<string>()

  for (const call of calls) {
    if (!call || typeof call.id !== 'string' || !call.id || ids.has(call.id)) {
      throw new CognitiveError('Provider returned missing or duplicate native call IDs')
    }

    if (
      typeof call.name !== 'string' ||
      !call.name ||
      !call.input ||
      typeof call.input !== 'object' ||
      Array.isArray(call.input)
    ) {
      throw new CognitiveError('Provider returned invalid native tool arguments')
    }

    ids.add(call.id)
  }

  if (assistant) {
    if (assistant.role !== 'assistant') {
      throw new CognitiveError('Provider continuation must be an assistant message')
    }

    const normalized = (assistant.toolCalls ?? []).map((call) => ({
      id: call.id,
      name: call.function.name,
      input: call.function.arguments ?? {},
    }))

    if (stableJSON(normalized) !== stableJSON(calls)) {
      throw new CognitiveError('Provider assistant message and normalized tool calls disagree')
    }

    const text =
      typeof assistant.content === 'string'
        ? assistant.content
        : (assistant.content
            ?.filter((part) => part.type === 'text')
            .map((part) => part.text ?? '')
            .join('') ?? '')

    if (text !== output) {
      throw new CognitiveError('Provider assistant message and visible output disagree')
    }
  }
}

type GenerateCodeProps = {
  iteration: Iteration
  ctx: Context
  cognitive: RuntimeCognitive
  controller: AbortController
  metadata?: Record<string, string>
  onSendDelta?: (delta: MessageDelta) => Promise<void> | void
  onBeforeRequest?: ExecutionHooks['onBeforeRequest']
  /** Start a complete normalized call without waiting for execution or the stream tail. */
  onToolCalls?: (calls: CognitiveToolCall[]) => boolean
}

async function prepareNativeRequest({
  iteration,
  ctx,
  cognitive,
  controller,
  metadata,
  onBeforeRequest,
}: GenerateCodeProps) {
  const modelRefs = Array.isArray(iteration.model) ? iteration.model : [iteration.model]
  if (!modelRefs.length) {
    throw new CognitiveError('At least one model is required.')
  }

  const models = await Promise.all(
    modelRefs.map(async (ref) => {
      try {
        return await abortable(cognitive.getModelDetails(ref), controller.signal)
      } catch (error) {
        throw new CognitiveError(`Failed to fetch model details for ${ref}: ${getErrorMessage(error)}`, {
          cause: error,
        })
      }
    })
  )
  const model = models[0]!
  // The same request can reach any fallback, so it must fit every candidate.
  const { limit, output: reserve } = resolveTokenBudget(models, ctx.maxTokens)
  const tools = [getRunJavaScriptTool(!!ctx.chat)]
  const systemMessage = structuredClone(iteration.systemMessage)
  const reasoningHint = getReasoningHint(iteration.reasoningEffort)
  if (reasoningHint) {
    systemMessage.content =
      typeof systemMessage.content === 'string'
        ? `${systemMessage.content}\n\n${reasoningHint}`
        : [...(systemMessage.content ?? []), { type: 'text', text: reasoningHint }]
  }

  const system = [systemMessage]
  const budgetInstruction = getBudgetInstruction(ctx, iteration)
  const budget = `\n\nExecution budget: response ${ctx.iterations.length} of ${ctx.loop}. ${budgetInstruction}`

  const buildMessages = (retainedIds: readonly string[], summary?: Transcript.SummaryMessage) => {
    const history = ctx.session.requestMessages({
      inspector: ctx.inspector,
      retainedIterationIds: retainedIds,
      summary,
    })
    const messages = [...structuredClone(system), ...history]
    const last = messages.at(-1)

    if (last) {
      last.content =
        typeof last.content === 'string'
          ? last.content + budget
          : [...(last.content ?? []), { type: 'text', text: budget.trim() }]
    }

    return messages
  }
  const compaction = await prepareAutoCompaction(ctx.session, {
    client: cognitive,
    model: iteration.model,
    signal: controller.signal,
    contextWindow: ctx.maxTokens,
    iterationId: iteration.id,
    inputLimit: limit - reserve,
    metadata,
    measure: (ids, summary) => countNativeRequestTokens(buildMessages(ids, summary), tools),
  })
  let messages = buildMessages(
    compaction?.retainedIterationIds ?? ctx.session.retainedIterationIds,
    compaction?.summary
  )
  let tokens = countNativeRequestTokens(messages, tools)

  const override = await callHook(() =>
    onBeforeRequest?.({ messages: structuredClone(messages), iteration, controller })
  )

  if (override) {
    messages = structuredClone(override.messages)
    tokens = countNativeRequestTokens(messages, tools)
  }

  if (tokens > limit - reserve) {
    throw new TokenOverflowError(
      override
        ? 'The onBeforeRequest messages exceed the context budget. Shorten them or increase options.maxTokens.'
        : 'The native prompt exceeds the context budget. Compact session input or increase options.maxTokens.',
      tokens,
      limit - reserve
    )
  }

  controller.signal.throwIfAborted()
  compaction?.commit()

  if (iteration.tokens) {
    iteration.tokens.limit = limit
    iteration.tokens.context = measureNativeContextTokens(iteration, messages, tools, tokens)
  }

  const hasAudio = messages.some(
    (message) => Array.isArray(message.content) && message.content.some((part) => part.type === 'audio')
  )
  const input: Parameters<RuntimeCognitive['generateText']>[0] = {
    model: iteration.model,
    temperature: iteration.temperature,
    responseFormat: 'text',
    reasoningEffort: iteration.reasoningEffort,
    messages,
    tools,
    toolControl: { mode: ctx.chat ? 'auto' : 'required', parallel: false },
    maxTokens: reserve,
    meta: metadata ? { metadata } : undefined,
    options: {
      ...(hasAudio ? { transcriptionModel: ctx.transcriptionModel ?? 'fast' } : {}),
      ...(ctx.maxTimeToFirstToken ? { maxTimeToFirstToken: ctx.maxTimeToFirstToken } : {}),
      ...(ctx.midStreamFallback ? { midStreamFallback: true } : {}),
    },
  }

  return { input, model }
}

function getBudgetInstruction(ctx: Context, iteration: Iteration): string {
  if (ctx.iterations.length < ctx.loop) {
    const delivery = ctx.chat
      ? 'Component delivery needs no inspection. Keep lookups and retries silent unless progress updates were requested. If requested, include the update alongside the continuing call.'
      : WORKER_RESPONSE_INSTRUCTION

    return `Inspect business results that need interpretation before completing; never guess missing completion fields. Once the required facts are known, complete using retained values without repeating successful calls. ${delivery}`
  }

  if (ctx.chat) {
    return 'This is the last response. Answer from inspected evidence with normal assistant text, or use JavaScript with an explicit return exit("listen") or another registered named exit. Do not start work that needs another model response.'
  }

  if (!iteration.exits.length) {
    return `${WORKER_RESPONSE_INSTRUCTION} This is the last response. Every JavaScript program must explicitly return inspect(value) with the available evidence. Do not start work that needs another model response.`
  }

  return `${WORKER_RESPONSE_INSTRUCTION} This is the last response. Finish with return exit("NAME", payload) from run_javascript, using a registered name. Build the payload from inspected $return and retained variables; do not repeat successful lookups to reconstruct it. If the task is incomplete, report it honestly with an incomplete or error payload only when the exit schema permits it. Assistant prose and inspection returns do not complete a worker. Do not start work that requires another model response.`
}

async function consumeNativeStream({
  cognitive,
  input,
  controller,
  maxIdleTime,
  onChunk,
}: {
  cognitive: RuntimeCognitive
  input: Parameters<RuntimeCognitive['generateText']>[0]
  controller: AbortController
  maxIdleTime: number
  onChunk: (chunk: NativeChunk) => Promise<void>
}): Promise<void> {
  const streamController = createJoinedAbortController([controller.signal])
  const stream = cognitive.generateTextStream!(input, { signal: streamController.signal })
  let completed = false

  try {
    while (true) {
      controller.signal.throwIfAborted()
      const chunk = await readNextStreamChunk(stream, streamController, maxIdleTime)

      if (chunk.done) {
        completed = true
        return
      }

      await onChunk(chunk.value as NativeChunk)
    }
  } finally {
    streamController.abort('LLM stream closed')

    if (!completed) {
      // A stalled generator may never finish return(); cancellation must not wait for it.
      void stream.return(undefined).catch(() => {})
    }
  }
}

async function readNextStreamChunk(
  stream: AsyncGenerator<CognitiveStreamChunk, void, unknown>,
  controller: AbortController,
  maxIdleTime: number
): Promise<IteratorResult<CognitiveStreamChunk, void>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort('LLM stream stalled')
      reject(new CognitiveError('LLM stream stalled'))
    }, maxIdleTime)
  })

  try {
    return await abortable(Promise.race([stream.next(), timeout]), controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

export async function generateCode({
  iteration,
  ctx,
  cognitive,
  controller,
  metadata,
  onSendDelta,
  onToolCalls,
  onBeforeRequest,
}: GenerateCodeProps): Promise<NativeGeneration> {
  const startedAt = Date.now()
  controller.signal.throwIfAborted()
  const { input, model } = await prepareNativeRequest({
    iteration,
    ctx,
    cognitive,
    controller,
    metadata,
    onBeforeRequest,
  })
  iteration.recordTrace({ type: 'llm_call_started', started_at: startedAt, model: model.id })
  let output = ''
  let toolCalls: CognitiveToolCall[] = []
  let responseMetadata: CognitiveMetadata | undefined
  let assistantMessage: CognitiveMessage | undefined
  let continuation: unknown
  let attempt = 1
  let ttft: number | undefined
  let ttl: number | undefined
  let previewed = false
  let accepted = false
  let dispatchedCalls: CognitiveToolCall[] | undefined
  let dispatchedFingerprint: string | undefined
  let offeredFingerprint: string | undefined
  const messageMetadata = (): MessageMetadata => ({ iterationId: iteration.id, id: `${iteration.id}:${attempt}:text` })
  const preview = async (delta: MessageDelta) => {
    try {
      await onSendDelta?.(delta)
    } catch (err) {
      if (delta.restart) {
        throw new CognitiveError(`LLM stream restart handler failed: ${getErrorMessage(err)}`, { cause: err })
      }
    }
  }

  try {
    controller.signal.throwIfAborted()

    if (typeof cognitive.generateTextStream === 'function') {
      let finished = false
      await consumeNativeStream({
        cognitive,
        input,
        controller,
        maxIdleTime: Math.max(STREAM_IDLE_TIMEOUT, ctx.maxTimeToFirstToken ?? 0),
        onChunk: async (value) => {
          if (value.error) {
            throw new CognitiveError(`LLM generation failed: ${value.error}`)
          }

          if (value.restart) {
            if (dispatchedCalls) {
              throw new CognitiveError(
                'The LLM stream restarted after tool execution began; completed work cannot be replayed.'
              )
            }

            if (!ctx.midStreamFallback) {
              throw new CognitiveError('Unexpected LLM stream restart')
            }

            if (!Number.isInteger(value.restart.attempt) || value.restart.attempt <= attempt) {
              throw new CognitiveError('Provider returned an invalid stream restart attempt')
            }

            if (value.output || value.toolCalls || value.finished) {
              throw new CognitiveError('A stream restart must not contain output from either attempt')
            }

            iteration.recordTrace({ type: 'llm_call_restarted', started_at: Date.now(), ...value.restart })
            // A failed retraction must stop execution, not replay the UI effect in finally.
            previewed = false
            await preview({ restart: true, iterationId: iteration.id, ...value.restart })
            attempt = value.restart.attempt
            output = ''
            toolCalls = []
            responseMetadata = undefined
            assistantMessage = undefined
            continuation = undefined
            ttft = undefined
            ttl = undefined
            finished = false
            previewed = false
            offeredFingerprint = undefined
            return
          }

          const callsFingerprint = value.toolCalls ? stableJSON(value.toolCalls) : undefined
          if (dispatchedCalls && callsFingerprint !== undefined && callsFingerprint !== dispatchedFingerprint) {
            throw new CognitiveError(
              'The LLM stream changed tool calls after execution began; completed work cannot be replayed.'
            )
          }

          const repeatedDispatchedCalls = dispatchedCalls && callsFingerprint === dispatchedFingerprint
          if (
            finished &&
            (value.output ||
              (value.toolCalls && !repeatedDispatchedCalls) ||
              value.assistantMessage ||
              value.continuation !== undefined)
          ) {
            throw new CognitiveError('Received content after stream completion')
          }

          if (value.metadata) {
            responseMetadata = value.metadata
          }

          if (value.toolCalls) {
            toolCalls = dispatchedCalls ?? value.toolCalls

            if (onToolCalls && !dispatchedCalls && toolCalls.length && offeredFingerprint !== callsFingerprint) {
              validateResponse(output + (value.output ?? ''), toolCalls, value.assistantMessage ?? assistantMessage)

              if (responseMetadata) {
                assertSuccessfulGeneration(responseMetadata)
              }

              const snapshot = freezeToolCalls(structuredClone(toolCalls))
              offeredFingerprint = callsFingerprint

              if (onToolCalls(snapshot)) {
                dispatchedCalls = snapshot
                dispatchedFingerprint = callsFingerprint
                toolCalls = snapshot
              }
            }
          }

          if (value.assistantMessage) {
            assistantMessage = value.assistantMessage
          }

          if (value.continuation !== undefined) {
            continuation = value.continuation
          }

          if (value.output) {
            output += value.output
            ttl = Date.now() - startedAt
            ttft ??= ttl
            previewed = true
            await preview({
              restart: false,
              ...messageMetadata(),
              type: 'text',
              delta: value.output,
              content: output,
            })
          }

          if (value.finished) {
            finished = true
          }
        },
      })

      if (!finished) {
        throw new CognitiveError('LLM stream ended without a completion signal')
      }
    } else {
      const response = (await abortable(
        cognitive.generateText(input, { signal: controller.signal }),
        controller.signal
      )) as NativeResponse

      if (response.error) {
        throw new CognitiveError(`LLM generation failed: ${response.error}`)
      }

      output = response.output ?? ''
      toolCalls = response.toolCalls ?? []
      assistantMessage = response.assistantMessage
      continuation = response.continuation
      responseMetadata = response.metadata
    }

    controller.signal.throwIfAborted()
    assertSuccessfulGeneration(responseMetadata)
    validateResponse(output, toolCalls, assistantMessage)

    if (responseMetadata?.stopReason === 'tool_calls' && !toolCalls.length) {
      throw new CognitiveError('Provider signaled tool calls but returned none')
    }

    accepted = true
  } catch (err) {
    throw isLLMzError(err) ? err : new CognitiveError(`LLM generation failed: ${getErrorMessage(err)}`, { cause: err })
  } finally {
    const usage = responseMetadata?.usage ?? { inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 }
    iteration.llm = {
      started_at: startedAt,
      ended_at: Date.now(),
      status: accepted ? 'success' : 'error',
      output,
      cached: responseMetadata?.cached ?? false,
      tokens: usage.inputTokens + usage.outputTokens,
      spend: responseMetadata?.cost ?? 0,
      model: responseMetadata?.model ?? model.id,
      time_to_first_token: ttft,
      time_to_last_token: ttl,
      usage,
    }

    if (iteration.tokens) {
      Object.assign(iteration.tokens, {
        input: usage.inputTokens,
        output: usage.outputTokens,
        total: usage.inputTokens + usage.outputTokens,
      })
    }

    if (!accepted && previewed) {
      await preview({
        restart: true,
        iterationId: iteration.id,
        attempt: attempt + 1,
        fromModel: model.id,
        toModel: model.id,
        reason: 'Generation did not complete successfully',
      })
    }
  }

  const code = toolCalls.find((call) => call.name === 'run_javascript')?.input?.code
  iteration.recordTrace({
    type: 'llm_call_success',
    started_at: startedAt,
    ended_at: Date.now(),
    model: model.id,
    code: typeof code === 'string' ? code : '',
  })

  return {
    attempt,
    output,
    toolCalls,
    assistantMessage,
    continuation,
    metadata: responseMetadata!,
    messageMetadata: messageMetadata(),
  }
}

/** Keep execution's accepted arguments independent of later provider or callback mutations. */
function freezeToolCalls(calls: CognitiveToolCall[]): CognitiveToolCall[] {
  const freeze = (value: unknown): void => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
      return
    }

    for (const child of Object.values(value)) {
      freeze(child)
    }

    Object.freeze(value)
  }

  freeze(calls)

  return calls
}
