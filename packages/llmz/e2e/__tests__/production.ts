import type { CognitiveMetadata, CognitiveStreamChunk } from '@botpress/cognitive'
import { expect } from 'vitest'
import {
  _CustomModelClient,
  type RuntimeGenerateContentInput,
  type RuntimeGenerateContentOptions,
} from '../../src/custom-client.js'
import { type ChatMessage, type ExecutionResult } from '../../src/index.js'
import { createTestChat } from './chat.js'
import { getCachedCognitiveClient } from './index.js'

// Compare the reported Qwen route, both requested GPT-OSS providers, and a Luna control.
// A single-element model array below prevents a fallback from hiding a failing route.
export const productionModels = (
  process.env.LLMZ_EVAL_MODELS ?? 'groq:qwen3.8-27b,cerebras:gpt-oss-120b,groq:gpt-oss-120b,openai:gpt-5.6-luna'
)
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)
export const productionOptions = { loop: 4, timeout: 45_000 }
const cached = getCachedCognitiveClient()

/** Replay one explicit fault, if requested; every subsequent response is a real cached provider call. */
class ProductionClient extends _CustomModelClient {
  public metadata: CognitiveMetadata[] = []
  public restarts: unknown[] = []
  public requests: RuntimeGenerateContentInput[] = []
  private seeded = false

  public constructor(private readonly firstCode?: string) {
    super()
  }

  public getModelDetails(model: string) {
    return cached.getModelDetails(model)
  }

  public async generateText(input: RuntimeGenerateContentInput, options?: RuntimeGenerateContentOptions) {
    const result = await cached.generateText(input, options)
    this.metadata.push(result.metadata)
    return result
  }

  public async *generateTextStream(
    input: RuntimeGenerateContentInput,
    options?: RuntimeGenerateContentOptions
  ): AsyncGenerator<CognitiveStreamChunk> {
    this.requests.push(structuredClone(input))
    if (this.firstCode !== undefined && !this.seeded) {
      this.seeded = true
      yield {
        created: 0,
        finished: true,
        output: '',
        toolCalls: [{ id: 'production_fault', name: 'run_javascript', input: { code: this.firstCode } }],
        metadata: {
          provider: 'fixture',
          model: 'production-fault-replay',
          cost: 0,
          stopReason: 'tool_calls',
          usage: { inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 },
        },
      }
      return
    }

    for await (const chunk of cached.generateTextStream(input, options)) {
      if (chunk.metadata) this.metadata.push(chunk.metadata)
      if (chunk.restart) this.restarts.push(chunk.restart)
      yield chunk
    }
  }
}

export function productionChat(firstCode?: string) {
  const messages: ChatMessage[] = []
  const deltas: string[] = []
  const client = new ProductionClient(firstCode)
  const chat = createTestChat({
    onMessage: (message) => {
      messages.push(message)
    },
    onDelta: (delta) => {
      if (!delta.restart) deltas.push(delta.delta)
    },
  })
  return { client, chat, messages, deltas }
}

export function textOf(messages: ChatMessage[]): string {
  return messages.flatMap((message) => (message.type === 'text' ? [message.text] : [])).join('\n')
}

/** Check the delivered surface, not just the model's final buffer. No formatting exact matches. */
export function expectCleanDelivery(messages: ChatMessage[], deltas: string[]): void {
  for (const text of [
    ...messages.flatMap((message) => (message.type === 'text' ? [message.text] : [])),
    deltas.join(''),
  ]) {
    expect.soft(text).not.toMatch(/<\/?think\b|<\/?tool_call\b|<\|(?:im_start|im_end|assistant|analysis)\|>/i)
    expect.soft(text).not.toMatch(/"(?:type|payload|streamId)"\s*:/)
    expect.soft(text).not.toMatch(/run_javascript|return\s+(?:inspect|exit)\s*\(/)
    expect.soft(text).not.toMatch(/<\/?(?:examples|example|assistant_turn|assistant_text|native_tool_call|arguments)\b/)
    expect.soft(text).not.toMatch(/FICTIONAL EXAMPLE|NOT LIVE HISTORY|demonstration_block|real_context_starts_here/)
  }
  for (const message of messages) {
    if (message.type === 'text') expect.soft(message.text.trim()).not.toBe('')
  }
}

export function expectProductionRun(result: ExecutionResult, client: ProductionClient, model: string): void {
  console.info(
    JSON.stringify({
      scenario: expect.getState().currentTestName,
      model,
      actualModels: [...new Set(client.metadata.map((metadata) => metadata.model))],
      iterations: result.iterations.map((iteration) => ({
        status: iteration.status.type,
        code: iteration.code,
        errors: iteration.errors.map((error) => ({ code: error.code, message: error.message })),
      })),
    })
  )
  // Infrastructure failures and provider fallbacks must never masquerade as model regressions.
  expect.soft(client.metadata.length, 'At least one real provider response is required').toBeGreaterThan(0)
  expect.soft(client.restarts).toEqual([])
  for (const metadata of client.metadata) {
    expect.soft(metadata.model).toBe(model)
    expect.soft(metadata.fallbackPath ?? []).toEqual([])
  }
  expect.soft(result.isError(), result.isError() ? result.error.message : result.status).toBe(false)
  expect.soft(result.iterations.length).toBeLessThanOrEqual(productionOptions.loop)
  for (const iteration of result.iterations) {
    expect.soft(iteration.code ?? '', 'Fictional example APIs must never be called').not.toMatch(/\bexample[A-Z_]\w*/)
  }
  expect
    .soft(JSON.stringify(result.session.toJSON()), 'Demonstrations must not become real session history')
    .not.toMatch(/FICTIONAL EXAMPLE|llmz_example_/)
}
