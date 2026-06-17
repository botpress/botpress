import type { Model, ModelRef } from '../models'
import type { InputProps, Response } from '../types'
// `CognitiveBeta` + `getCognitiveV2Model` live in ./index. This creates an
// import cycle (index re-exports this adapter), but it's safe: both bindings
// are only referenced inside function bodies, never at module-eval time.
import { CognitiveBeta, getCognitiveV2Model } from './index'
import type { CognitiveMetadata, CognitiveStreamChunk } from './types'

/**
 * The subset of the {@link import('../client').Cognitive} surface that
 * downstream consumers (notably `llmz`) actually call. A `CognitiveBeta`
 * doesn't implement these names directly (it exposes `generateText`,
 * `generateTextStream`, `listModels`), so {@link cognitiveFromBeta} adapts one
 * into this shape.
 */
export type CognitiveLike = {
  getModelDetails(model: string): Promise<Model>
  generateContent(input: InputProps): Promise<Response>
  generateContentStream(input: InputProps): AsyncGenerator<CognitiveStreamChunk, Response, void>
}

/**
 * Builds the canonical `Response` from a (streamed or non-streamed) beta output
 * + metadata. Kept module-level so both `Cognitive` and the beta adapter
 * produce a byte-for-byte identical `Response` shape.
 */
export function buildResponseFromBetaMetadata(output: string, metadata: CognitiveMetadata): Response {
  return {
    output: {
      id: 'beta-output',
      provider: metadata.provider,
      model: metadata.model!,
      choices: [
        {
          type: 'text',
          content: output,
          role: 'assistant',
          index: 0,
          stopReason: metadata.stopReason ?? 'stop',
        },
      ],
      usage: {
        inputTokens: metadata.usage.inputTokens,
        inputCost: 0,
        outputTokens: metadata.usage.outputTokens,
        outputCost: metadata.cost ?? 0,
      },
      botpress: {
        cost: metadata.cost ?? 0,
      },
    },
    meta: {
      cached: metadata.cached,
      model: { integration: metadata.provider, model: metadata.model! },
      latency: metadata.latency!,
      cost: {
        input: 0,
        output: metadata.cost || 0,
      },
      tokens: {
        input: metadata.usage.inputTokens,
        output: metadata.usage.outputTokens,
      },
    },
  }
}

// The v2 API expects `systemPrompt` as a leading system message rather than a
// separate field. Same transform `Cognitive._generateContentV2` performs.
function toBetaInput(input: InputProps): InputProps {
  const v2Input = { ...input, messages: [...input.messages] }
  if (v2Input.systemPrompt) {
    // @ts-expect-error - system role is not supported in the integrations api, but is used in v2
    v2Input.messages.unshift({ role: 'system', content: v2Input.systemPrompt })
    delete v2Input.systemPrompt
  }
  return v2Input
}

/**
 * Adapts a {@link CognitiveBeta} into the {@link CognitiveLike} surface so it
 * can be used anywhere a `Cognitive` client is expected (e.g. `llmz`'s
 * `execute({ client })`).
 *
 * Crucially this is **v2-only**: model details are resolved from the static v2
 * table or the live `/v2/cognitive/models` endpoint (with a permissive
 * fallback), and generation goes straight to the beta transport. It never
 * touches the v1 integration path, model preferences, or the File API — so it
 * works for any model the v2 endpoint serves, including ones missing from the
 * static table / provider allow-list.
 */
export function cognitiveFromBeta(beta: CognitiveBeta): CognitiveLike {
  let remoteModels: Map<string, Model> | null = null

  const fetchRemote = async (): Promise<Map<string, Model>> => {
    if (remoteModels) return remoteModels
    const list = await beta.listModels()
    const map = new Map<string, Model>()
    for (const m of list) {
      // The v2 `Model` is structurally a superset of the `models.ts` `Model`
      // for the fields consumers read (id/name/tags/input/output); widen it.
      const converted = { ...m, ref: m.id as ModelRef, integration: 'cognitive-v2' } as unknown as Model
      map.set(m.id, converted)
      for (const alias of m.aliases ?? []) {
        map.set(alias, converted)
      }
    }
    remoteModels = map
    return map
  }

  return {
    async getModelDetails(model: string): Promise<Model> {
      // 1. Static table (covers best/fast/auto + well-known ids, no network).
      const resolved = getCognitiveV2Model(model)
      if (resolved) {
        return { ...resolved, ref: resolved.id as ModelRef, integration: 'cognitive-v2' } as unknown as Model
      }
      // 2. Live v2 model list (covers models the static table doesn't know).
      try {
        const found = (await fetchRemote()).get(model)
        if (found) return found
      } catch {
        // fall through to permissive default
      }
      // 3. Permissive default — never throw, never fall back to v1. The
      //    generate call surfaces the real error if the model is invalid.
      return {
        id: model,
        ref: model as ModelRef,
        integration: 'cognitive-v2',
        name: model,
        description: '',
        tags: [],
        input: { maxTokens: 128_000, costPer1MTokens: 0 },
        output: { maxTokens: 8_192, costPer1MTokens: 0 },
      } as Model
    },

    async generateContent(input: InputProps): Promise<Response> {
      const response = await beta.generateText(toBetaInput(input) as any, {
        signal: input.signal,
      })
      return buildResponseFromBetaMetadata(response.output, response.metadata)
    },

    async *generateContentStream(input: InputProps): AsyncGenerator<CognitiveStreamChunk, Response, void> {
      const v2Input = toBetaInput(input)
      let lastMetadata: CognitiveMetadata | undefined
      const parts: string[] = []

      for await (const chunk of beta.generateTextStream(v2Input as any, { signal: input.signal })) {
        if (chunk.output) parts.push(chunk.output)
        if (chunk.metadata) lastMetadata = chunk.metadata
        yield chunk
      }

      if (!lastMetadata) {
        throw new Error('Streaming completed without metadata')
      }
      return buildResponseFromBetaMetadata(parts.join(''), lastMetadata)
    },
  }
}
