import type { CognitiveMetadata, CognitiveStreamChunk } from '@botpress/cognitive'
import { clamp } from 'lodash-es'

import { createJoinedAbortController } from '../abort-signal.js'
import type { MessageDelta, MessageMetadata } from '../chat.js'
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
const STREAM_INACTIVITY_TIMEOUT = 180_000

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
  onSend?: (send: ParsedSend, metadata: MessageMetadata) => Promise<void>
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
    model: model.id,
  })

  // Only set when the prompt carries audio (voice messages): tells cognitive
  // which STT model to transcribe with when the LLM lacks native audio support
  const hasAudioParts = messages.some(
    (message) => Array.isArray(message.content) && message.content.some((part) => part.type === 'audio')
  )

  const input: Parameters<RuntimeCognitive['generateText']>[0] = {
    model: iteration.model,
    temperature: iteration.temperature,
    responseFormat: 'text',
    reasoningEffort: iteration.reasoningEffort,
    messages,
    stopSequences: ctx.version.getStopTokens(),
    meta: metadata ? { metadata } : undefined,
    options: hasAudioParts ? { transcriptionModel: ctx.transcriptionModel ?? 'fast' } : undefined,
  }

  let responseMetadata: CognitiveMetadata | undefined
  let raw: string
  let assistantResponse: ParsedAssistantResponse

  /** Milliseconds between the stream request and the first/last streamed tokens. */
  let timeToFirstToken: number | undefined
  let timeToLastToken: number | undefined

  const midStreamFallback = ctx.midStreamFallback === true
  let attempt = 1
  const messageMetadata = (itemId: string): MessageMetadata => ({
    iterationId: iteration.id,
    id: midStreamFallback ? `${iteration.id}:${attempt}:${itemId}` : `${iteration.id}:${itemId}`,
  })
  // Previews are always live, including reset-only deltas. Await the callback
  // so consumers observe the reset before replacement text, even when async.
  const preview = async (delta: MessageDelta) => {
    try {
      await onSendDelta?.(delta)
    } catch (err: unknown) {
      // Preview failures never prevent authoritative delivery.
      void err
    }
  }
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
        const delta: MessageDelta = {
          restart: false,
          ...messageMetadata(item.id),
          component: item.name,
          props: item.props,
          delta: event.delta,
          content,
        }
        await preview(delta)
      } else if (event.type === 'item-complete') {
        if (event.item.kind === 'send' && onSend) {
          const send = {
            name: event.item.name,
            props: event.item.props,
            body: event.item.body,
          }
          await onSend(send, messageMetadata(event.item.id))
        } else if (event.item.kind === 'run' && event.item.status === 'complete' && !runCompleted) {
          // The ■run block is fully parsed (only the first one counts — the
          // response may invalidly contain more): execution can start while
          // the rest of the response streams
          runCompleted = true
          const code = (event.item.body ?? '').trim()
          onRunComplete?.(code)
        }
      }
    }
  }

  if (typeof cognitive.generateTextStream === 'function') {
    // Parse and deliver messages incrementally, including in fallback mode.
    let parser = new StreamingMessageParser()
    let fence = new LeadingFenceFilter()

    // Guard against stalled streams: the transport has no timeout of its own
    // when a signal is provided, so a silent connection would hang forever.
    const streamController = createJoinedAbortController([controller.signal])
    const requestedAt = Date.now()
    const stream = cognitive.generateTextStream(
      {
        ...input,
        // Passed through to the cognitive request: fall back to the next
        // model/provider when the first token takes too long
        ...(ctx.maxTimeToFirstToken || midStreamFallback
          ? {
              options: {
                ...input.options,
                ...(ctx.maxTimeToFirstToken ? { maxTimeToFirstToken: ctx.maxTimeToFirstToken } : {}),
                ...(midStreamFallback ? { midStreamFallback: true } : {}),
              },
            }
          : {}),
      },
      { signal: streamController.signal }
    )

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
    let streamCompleted = false

    try {
      while (true) {
        let chunk: IteratorResult<CognitiveStreamChunk, unknown>
        try {
          chunk = await nextChunk()
        } catch (thrown: unknown) {
          throw new CognitiveError(`LLM generation failed: ${getErrorMessage(thrown)}`)
        }

        if (chunk.done) {
          streamCompleted = true
          break
        }

        if (chunk.value?.restart && !midStreamFallback) {
          streamController.abort('Unexpected LLM stream restart')
          throw new CognitiveError('LLM stream restarted without options.midStreamFallback enabled')
        }

        if (chunk.value?.restart) {
          traces.push({ type: 'llm_call_restarted', started_at: Date.now(), ...chunk.value.restart })
          raw = ''
          parser = new StreamingMessageParser()
          fence = new LeadingFenceFilter()
          liveItems.clear()
          liveContent.clear()
          codeGenerationTraced = false
          runCompleted = false
          responseMetadata = undefined
          attempt = chunk.value.restart.attempt
          // Emit even when the replacement has no sends: previous previews
          // must disappear immediately, not wait for another text delta.
          await preview({ ...chunk.value.restart, restart: true, iterationId: iteration.id })
          // Keep request-relative timing (including handoff latency), but only
          // report tokens from the surviving attempt.
          timeToFirstToken = undefined
          timeToLastToken = undefined
          continue
        }

        if (chunk.value?.metadata) {
          responseMetadata = chunk.value.metadata
        }

        const delta = chunk.value?.output
        if (!delta) {
          continue
        }

        timeToLastToken = Date.now() - requestedAt
        timeToFirstToken ??= timeToLastToken

        raw += delta
        await dispatchSends(parser.push(fence.push(delta)))
      }

      if (!responseMetadata) {
        throw new CognitiveError('LLM streaming completed without metadata')
      }

      const remaining = fence.flush()
      if (remaining) {
        await dispatchSends(parser.push(remaining))
      }
      await dispatchSends(parser.finish())

      assistantResponse = toParsedAssistantResponse(parser.items, raw)
    } finally {
      // Release transport resources and the joined signal's parent listener,
      // including when a callback throws or an unexpected restart is rejected.
      streamController.abort('LLM stream closed')
      if (!streamCompleted) {
        // Do not wait: a stalled custom iterator may never settle its next().
        void stream.return(undefined).catch(() => {})
      }
    }

    // Tool execution still waits for successful generation in fallback mode.
    // Cancellation/deadlines are never renewed across attempts.
    if (midStreamFallback) {
      controller.signal.throwIfAborted()
    }
  } else {
    const response = await cognitive.generateText(input, { signal: controller.signal }).catch((thrown: unknown) => {
      throw new CognitiveError(`LLM generation failed: ${getErrorMessage(thrown)}`)
    })

    if (!response.output) {
      throw new CognitiveError('LLM did not return any text output')
    }

    responseMetadata = response.metadata
    raw = response.output
    assistantResponse = ctx.version.parseAssistantResponse(raw)

    for (const [index, send] of assistantResponse.sends.entries()) {
      await onSend?.(send, messageMetadata(`send-${index}`))
    }
  }

  iteration.code = assistantResponse.code
  iteration.sends = assistantResponse.sends
  iteration.next = assistantResponse.next

  const usage = responseMetadata.usage

  iteration.llm = {
    cached: responseMetadata.cached || false,
    ended_at: Date.now(),
    started_at: startedAt,
    status: 'success',
    tokens: usage.inputTokens + usage.outputTokens,
    spend: responseMetadata.cost ?? usage.inputCost + usage.outputCost,
    output: assistantResponse.raw,
    model: `${responseMetadata.provider}:${responseMetadata.model}`,
    time_to_first_token: timeToFirstToken,
    time_to_last_token: timeToLastToken,
    usage: {
      inputTokens: usage.inputTokens,
      inputCost: usage.inputCost,
      outputTokens: usage.outputTokens,
      outputCost: usage.outputCost,
    },
  }

  if (iteration.tokens) {
    iteration.tokens.input = usage.inputTokens
    iteration.tokens.output = usage.outputTokens
    iteration.tokens.total = usage.inputTokens + usage.outputTokens
  }

  traces.push({
    type: 'llm_call_success',
    started_at: startedAt,
    ended_at: iteration.llm.ended_at,
    model: iteration.llm.model,
    code: iteration.code ?? '',
  })
}
