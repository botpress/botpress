import { Cognitive } from '@botpress/cognitive'
import { clamp } from 'lodash-es'

import { createJoinedAbortController } from '../abort-signal.js'
import type { MessageDelta } from '../chat.js'
import { Context, Iteration } from '../context.js'
import { CognitiveError } from '../errors.js'
import { StreamingMessageParser } from '../message-stream/parser.js'
import type { MessageStreamEvent, ParsedItem } from '../message-stream/types.js'
import { toParsedAssistantResponse } from '../prompts/common.js'
import type { ParsedAssistantResponse, ParsedSend } from '../prompts/prompt.js'
import { truncateWrappedContent } from '../truncator.js'
import { getErrorMessage } from '../utils.js'
import { RuntimeCognitive } from './types.js'

const RESPONSE_LENGTH_BUFFER = {
  MIN_TOKENS: 1_000,
  MAX_TOKENS: 16_000,
  PERCENTAGE: 0.1,
} as const

/** Maximum time to wait between two stream chunks before considering the stream stalled. */
const STREAM_INACTIVITY_TIMEOUT = 60_000

const getModelOutputLimit = (inputLength: number) =>
  clamp(
    RESPONSE_LENGTH_BUFFER.PERCENTAGE * inputLength,
    RESPONSE_LENGTH_BUFFER.MIN_TOKENS,
    RESPONSE_LENGTH_BUFFER.MAX_TOKENS
  )

type GenerateCodeProps = {
  iteration: Iteration
  ctx: Context
  cognitive: RuntimeCognitive
  controller: AbortController
  metadata?: Record<string, string>
  /**
   * Called for each completed `■send` block. On streaming clients this fires
   * while the model is still generating — messages are delivered progressively.
   */
  onSend?: (send: ParsedSend) => Promise<void>
  /**
   * Called for each `■send` body chunk as it is parsed from the stream
   * (streaming clients only). Best-effort: errors are ignored.
   */
  onSendDelta?: (delta: MessageDelta) => Promise<void> | void
  /**
   * Called as soon as the model opens a `■run` block, while the code is still
   * being generated (streaming clients only). Used to pre-warm the VM.
   */
  onRunStart?: () => void
  /**
   * Called with the code of the first `■run` block the moment it is fully
   * parsed — the rest of the response (e.g. `■next`) may still be streaming
   * (streaming clients only). Used to start executing the code early.
   */
  onRunComplete?: (code: string) => void
}

/**
 * Models sometimes wrap their whole response in a code fence. The fence has to
 * be removed before it reaches the incremental parser, otherwise it would be
 * recovered as an unexpected-text message. Works on arbitrary chunk boundaries
 * by holding content back until the first newline.
 */
class LeadingFenceFilter {
  private _buffer = ''
  private _done = false

  public push(text: string): string {
    if (this._done) {
      return text
    }
    this._buffer += text
    const newline = this._buffer.indexOf('\n')
    if (newline === -1) {
      return ''
    }
    this._done = true
    const firstLine = this._buffer.slice(0, newline)
    const rest = this._buffer.slice(newline + 1)
    this._buffer = ''
    return firstLine.trim().startsWith('```') ? rest : `${firstLine}\n${rest}`
  }

  public flush(): string {
    if (this._done) {
      return ''
    }
    this._done = true
    const buffered = this._buffer
    this._buffer = ''
    return buffered.trim().startsWith('```') ? '' : buffered
  }
}

export const generateCode = async ({
  iteration,
  ctx,
  cognitive,
  controller,
  metadata,
  onSend,
  onSendDelta,
  onRunStart,
  onRunComplete,
}: GenerateCodeProps) => {
  const startedAt = Date.now()
  const traces = iteration.traces

  const modelRef = Array.isArray(iteration.model) ? iteration.model[0]! : iteration.model
  const model = await cognitive.getModelDetails(modelRef).catch((thrown: unknown) => {
    throw new CognitiveError(`Failed to fetch model details for model "${modelRef}": ${getErrorMessage(thrown)}`)
  })
  let modelLimit = Math.max(model.input.maxTokens, 8_000)
  if (ctx.maxTokens) {
    // User-provided cap on the context window: effective max = min(override, model max)
    modelLimit = Math.min(ctx.maxTokens, modelLimit)
  }
  const responseLengthBuffer = getModelOutputLimit(modelLimit)

  if (iteration.tokens) {
    iteration.tokens.limit = modelLimit
  }

  let messages: typeof iteration.messages
  try {
    messages = truncateWrappedContent({
      messages: iteration.messages,
      tokenLimit: modelLimit - responseLengthBuffer,
      throwOnFailure: true,
    }).filter((x) => typeof x.content !== 'string' || x.content.trim().length > 0)
  } catch (thrown: unknown) {
    // A prompt that doesn't fit the context window is a terminal configuration
    // error: the failure happens before any LLM call and the prompt only grows
    // across iterations, so retrying can never succeed. CognitiveError stops
    // the execution loop instead of burning iterations until the loop limit.
    const cap = ctx.maxTokens
      ? ` (context window capped at ${modelLimit} tokens by options.maxTokens — consider raising or removing it)`
      : ` (model context window: ${modelLimit} tokens)`
    throw new CognitiveError(`The prompt does not fit in the context window${cap}: ${getErrorMessage(thrown)}`)
  }
  iteration.messages = messages

  traces.push({
    type: 'llm_call_started',
    started_at: startedAt,
    ended_at: startedAt,
    model: model.ref,
  })

  const input = {
    signal: controller.signal,
    systemPrompt: messages.find((x) => x.role === 'system')?.content as string | undefined,
    model: iteration.model as Required<Parameters<Cognitive['generateContent']>[0]>['model'],
    temperature: iteration.temperature,
    responseFormat: 'text' as const,
    reasoningEffort: iteration.reasoningEffort,
    messages: messages.filter((x) => x.role !== 'system') as Parameters<Cognitive['generateContent']>[0]['messages'],
    stopSequences: ctx.version.getStopTokens(),
    meta: metadata
      ? ({ metadata } as NonNullable<Parameters<RuntimeCognitive['generateContent']>[0]['meta']>)
      : undefined,
  }

  let output: Awaited<ReturnType<RuntimeCognitive['generateContent']>>
  let raw: string
  let assistantResponse: ParsedAssistantResponse

  /** Milliseconds between the stream request and the first/last streamed tokens. */
  let timeToFirstToken: number | undefined
  let timeToLastToken: number | undefined

  const liveItems = new Map<string, ParsedItem>()
  const liveContent = new Map<string, string>()
  let codeGenerationTraced = false
  let runCompleted = false

  const dispatchSends = async (events: MessageStreamEvent[]) => {
    for (const event of events) {
      if (event.type === 'item-start') {
        liveItems.set(event.item.id, event.item)
        if (event.item.kind === 'run' && !codeGenerationTraced) {
          // The model just opened a ■run block: signal that code is being
          // generated so consumers can show progress while waiting for the
          // code to complete and execute
          codeGenerationTraced = true
          traces.push({ type: 'code_generation_started', started_at: Date.now() })
          onRunStart?.()
        }
      } else if (event.type === 'body-delta' && onSendDelta) {
        const item = liveItems.get(event.itemId)
        if (item?.kind !== 'send') {
          continue
        }
        const content = (liveContent.get(item.id) ?? '') + event.delta
        liveContent.set(item.id, content)
        try {
          // Progressive previews are best-effort; the authoritative delivery is onSend.
          await onSendDelta({
            id: `${iteration.id}:${item.id}`,
            component: item.name,
            props: item.props,
            delta: event.delta,
            content,
          })
        } catch (err: unknown) {
          void err
        }
      } else if (event.type === 'item-complete') {
        if (event.item.kind === 'send' && onSend) {
          await onSend({ name: event.item.name, props: event.item.props, body: event.item.body })
        } else if (event.item.kind === 'run' && event.item.status === 'complete' && !runCompleted) {
          // The ■run block is fully parsed (only the first one counts — the
          // response may invalidly contain more): execution can start while
          // the rest of the response streams
          runCompleted = true
          onRunComplete?.((event.item.body ?? '').trim())
        }
      }
    }
  }

  if (typeof cognitive.generateContentStream === 'function') {
    // Streaming path (Cognitive v2 / beta): parse ■ blocks incrementally and
    // dispatch messages while the model is still generating.
    const parser = new StreamingMessageParser()
    const fence = new LeadingFenceFilter()

    // Guard against stalled streams: the transport has no timeout of its own
    // when a signal is provided, so a silent connection would hang forever.
    const streamController = createJoinedAbortController([controller.signal])
    const requestedAt = Date.now()
    const stream = cognitive.generateContentStream({
      ...input,
      signal: streamController.signal,
      // Passed through to the cognitive v2 request: fall back to the next
      // model/provider when the first token takes too long
      ...(ctx.maxTimeToFirstToken ? { options: { maxTimeToFirstToken: ctx.maxTimeToFirstToken } } : {}),
    } as typeof input)

    // The client-side stall guard must leave room for the server-side
    // maxTimeToFirstToken fallback chain to run through its models
    const inactivityTimeout = Math.max(STREAM_INACTIVITY_TIMEOUT, ctx.maxTimeToFirstToken ?? 0)

    const nextChunk = async () => {
      let timer: NodeJS.Timeout | undefined
      const stalled = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          streamController.abort('LLM stream stalled')
          reject(new Error(`LLM stream stalled: no data received for ${inactivityTimeout}ms`))
        }, inactivityTimeout)
      })
      try {
        return await Promise.race([stream.next(), stalled])
      } finally {
        clearTimeout(timer)
      }
    }

    raw = ''

    while (true) {
      let chunk: IteratorResult<Awaited<ReturnType<(typeof stream)['next']>>['value'], unknown>
      try {
        chunk = await nextChunk()
      } catch (thrown: unknown) {
        throw new CognitiveError(`LLM generation failed: ${getErrorMessage(thrown)}`)
      }

      if (chunk.done) {
        output = chunk.value as Awaited<ReturnType<RuntimeCognitive['generateContent']>>
        break
      }

      const delta = (chunk.value as { output?: string })?.output
      if (!delta) {
        continue
      }

      timeToLastToken = Date.now() - requestedAt
      timeToFirstToken ??= timeToLastToken

      raw += delta
      await dispatchSends(parser.push(fence.push(delta)))
    }

    const remaining = fence.flush()
    if (remaining) {
      await dispatchSends(parser.push(remaining))
    }
    await dispatchSends(parser.finish())

    assistantResponse = toParsedAssistantResponse(parser.items, raw)
  } else {
    output = await cognitive.generateContent(input).catch((thrown: unknown) => {
      throw new CognitiveError(`LLM generation failed: ${getErrorMessage(thrown)}`)
    })

    const out = typeof output.output.choices?.[0]?.content === 'string' ? output.output.choices[0].content : null

    if (!out) {
      throw new CognitiveError('LLM did not return any text output')
    }

    raw = out
    assistantResponse = ctx.version.parseAssistantResponse(out)

    for (const send of assistantResponse.sends) {
      await onSend?.(send)
    }
  }

  iteration.code = assistantResponse.code
  iteration.sends = assistantResponse.sends
  iteration.next = assistantResponse.next

  iteration.llm = {
    cached: output.meta.cached || false,
    ended_at: Date.now(),
    started_at: startedAt,
    status: 'success',
    tokens: output.meta.tokens.input + output.meta.tokens.output,
    spend: output.meta.cost.input + output.meta.cost.output,
    output: assistantResponse.raw,
    model: `${output.meta.model.integration}:${output.meta.model.model}`,
    time_to_first_token: timeToFirstToken,
    time_to_last_token: timeToLastToken,
    usage: output.output.usage,
  }

  if (iteration.tokens) {
    iteration.tokens.input = output.meta.tokens.input
    iteration.tokens.output = output.meta.tokens.output
    iteration.tokens.total = output.meta.tokens.input + output.meta.tokens.output
  }

  traces.push({
    type: 'llm_call_success',
    started_at: startedAt,
    ended_at: iteration.llm.ended_at,
    model: model.ref,
    code: iteration.code ?? '',
  })
}
