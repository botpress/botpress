import type {
  CognitiveMessage,
  CognitiveMetadata,
  CognitiveResponse,
  CognitiveStreamChunk,
  CognitiveToolCall,
} from '@botpress/cognitive'
import { createJoinedAbortController } from '../abort-signal.js'
import type { MessageDelta, MessageMetadata } from '../chat.js'
import type { Context, ContextTokens, Iteration } from '../context.js'
import { CognitiveError } from '../errors.js'
import { getErrorMessage, getTokenizer } from '../utils.js'
import type { RuntimeCognitive } from './types.js'

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
const STATIC_TOKEN_PARTS = ['instructions', 'tools', 'protocol', 'examples'] as const
type StaticTokenPart = (typeof STATIC_TOKEN_PARTS)[number]

const staticTokenEstimates = new WeakMap<Iteration, Pick<ContextTokens, StaticTokenPart>>()

function assertSuccessfulGeneration(metadata: CognitiveMetadata | undefined) {
  if (!metadata || metadata.provider === 'unknown') {
    throw new CognitiveError('LLM generation failed: missing successful provider metadata')
  }

  if (
    metadata.stopReason === 'max_tokens' ||
    metadata.stopReason === 'content_filter' ||
    metadata.stopReason === 'other'
  ) {
    throw new CognitiveError(`LLM generation did not complete: stopReason=${metadata.stopReason}`)
  }
}

/** Count structured arguments and schemas too, rather than only message text. */
export function countNativeRequestTokens(messages: CognitiveMessage[], tools: unknown): number {
  return getTokenizer().count(JSON.stringify({ messages, tools }))
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
      examples: initial?.examples ?? 0,
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
  const examples = Math.floor(estimates.examples * scale)

  // Tokenization is not additive across JSON boundaries. Marginal request sizes
  // keep native history and schemas current; the residual includes scaffolding.
  return {
    total,
    framework: total - instructions - toolsTokens - protocol - examples - iterations,
    instructions,
    tools: toolsTokens,
    transcript: 0,
    protocol,
    examples,
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

/** Remove only the request-local trailing footer, never historic message content. */
function withoutMemoryFooter(messages: CognitiveMessage[], initial: CognitiveMessage[] = messages): CognitiveMessage[] {
  const copy = structuredClone(messages)
  const last = initial.at(-1)

  if (!last || last.role !== 'user') {
    return copy
  }

  const source = typeof last.content === 'string' ? last.content : (last.content?.at(-1)?.text ?? '')
  const start = source.lastIndexOf('\n\n<runtime-memory>\n')

  if (start < 0 || !source.endsWith('\n</runtime-memory>')) {
    return copy
  }

  const footer = source.slice(start)

  for (const message of copy) {
    if (message.role !== 'user') {
      continue
    }

    if (typeof message.content === 'string' && message.content.includes(footer)) {
      message.content = message.content.replace(footer, '')
      break
    }

    if (Array.isArray(message.content)) {
      const index = message.content.findIndex((part) => part.type === 'text' && part.text?.includes(footer))

      if (index >= 0) {
        const part = message.content[index]!
        const text = part.text!.replace(footer, '')

        if (!text) {
          message.content.splice(index, 1)
        } else {
          part.text = text
        }

        break
      }
    }
  }

  return copy
}

function withMemoryFooter(messages: CognitiveMessage[], footer: string): CognitiveMessage[] {
  const copy = structuredClone(messages)
  const last = copy.at(-1)
  const content = `\n\n<runtime-memory>\n${footer}\n</runtime-memory>`

  if (last?.role === 'user') {
    if (Array.isArray(last.content)) {
      last.content.push({ type: 'text', text: content })
    } else {
      last.content = (last.content ?? '') + content
    }
  } else {
    copy.push({ role: 'user', content: `Runtime context (LLMz):${content}` })
  }

  return copy
}

function stableJSON(value: unknown): string {
  function sortProperties(item: unknown): unknown {
    if (Array.isArray(item)) {
      return item.map(sortProperties)
    }

    if (item && typeof item === 'object') {
      const entries = Object.entries(item).sort(([left], [right]) => left.localeCompare(right))

      return Object.fromEntries(entries.map(([key, child]) => [key, sortProperties(child)]))
    }

    return item
  }

  return JSON.stringify(sortProperties(value))
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
  /** Start a complete normalized call without waiting for execution or the stream tail. */
  onToolCalls?: (calls: CognitiveToolCall[]) => boolean
}

async function prepareNativeRequest({ iteration, ctx, cognitive, controller, metadata }: GenerateCodeProps) {
  const modelRef = Array.isArray(iteration.model) ? iteration.model[0]! : iteration.model
  const model = await abortable(cognitive.getModelDetails(modelRef), controller.signal).catch((err: unknown) => {
    throw new CognitiveError(`Failed to fetch model details for ${modelRef}: ${getErrorMessage(err)}`)
  })
  const limit = Math.min(model.input.maxTokens, ctx.maxTokens ?? Infinity)
  const reserve = Math.min(model.output.maxTokens, Math.max(256, Math.min(16_000, Math.floor(limit * 0.1))))
  const tools = iteration.nativeTools?.tools ?? []
  const system = iteration.messages.filter((message) => message.role === 'system')
  const hookMessages = withoutMemoryFooter(
    iteration.messages.filter((message) => message.role !== 'system'),
    iteration.initialMessages ?? ctx.session.requestMessages()
  )
  const canonical = withoutMemoryFooter(ctx.session.requestMessages())
  const historyCustomized = stableJSON(hookMessages) !== stableJSON(canonical)
  const budgetInstruction = getBudgetInstruction(ctx)
  const budget = `\n\nExecution budget: response ${ctx.iterations.length} of ${ctx.loop}. ${budgetInstruction}`

  const buildMessages = () => {
    const history = historyCustomized
      ? withMemoryFooter(hookMessages, ctx.session.memory.render({ turn: ctx.session.turn }))
      : ctx.session.requestMessages()
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
  let messages = buildMessages()
  let tokens = countNativeRequestTokens(messages, tools)

  while (tokens > limit - reserve) {
    if (historyCustomized) {
      throw new CognitiveError(
        'The hook-modified native prompt does not fit in the context window. Shorten onIterationStart.messages or increase options.maxTokens; automatic compaction cannot safely rewrite custom history.'
      )
    }

    const ids = ctx.session.retainedIterationIds.filter((id) => id !== iteration.id)

    if (!ids.length) {
      break
    }

    ctx.session.compact(ids.slice(1).concat(iteration.id))
    // Rebuild both the inventory and bindings after compaction, before executing model code.
    iteration.variables = ctx.session.memory.getBindings()
    messages = buildMessages()
    tokens = countNativeRequestTokens(messages, tools)
  }

  if (tokens > limit - reserve) {
    throw new CognitiveError(
      `The native prompt does not fit in the context window (${limit} tokens). Compact session input or raise options.maxTokens.`
    )
  }

  iteration.messages = messages

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
    toolControl: { mode: 'auto', parallel: false },
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

function getBudgetInstruction(ctx: Context): string {
  if (ctx.iterations.length < ctx.loop) {
    return 'Reserve a response to inspect results before completing.'
  }

  if (ctx.chat) {
    return 'This is the last response. Complete with an available exit or an honest final answer; do not start work that needs another model response.'
  }

  return 'This is the last response. Finish by returning exit(name, payload) from run_javascript, using a registered exit. If the task is incomplete, report it honestly with an incomplete or error payload only when the exit schema permits it. Assistant prose and inspection returns do not complete a worker. Do not start work that requires another model response.'
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
}: GenerateCodeProps): Promise<NativeGeneration> {
  const startedAt = Date.now()
  controller.signal.throwIfAborted()
  const { input, model } = await prepareNativeRequest({ iteration, ctx, cognitive, controller, metadata })
  iteration.traces.push({ type: 'llm_call_started', started_at: startedAt, model: model.id })
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
        throw new CognitiveError(`LLM stream restart handler failed: ${getErrorMessage(err)}`)
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

            iteration.traces.push({ type: 'llm_call_restarted', started_at: Date.now(), ...value.restart })
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
              component: 'message',
              props: {},
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
    throw err instanceof CognitiveError ? err : new CognitiveError(`LLM generation failed: ${getErrorMessage(err)}`)
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
  iteration.traces.push({
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
