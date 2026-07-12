import { Model } from '@botpress/cognitive'
import { RuntimeCognitive } from './runtime/types.js'

export type RuntimeGenerateContentInput = Parameters<RuntimeCognitive['generateContent']>[0]
export type RuntimeGenerateContentOutput = Awaited<ReturnType<RuntimeCognitive['generateContent']>>

/**
 * Internal escape hatch for supplying a custom model client that bypasses Cognitive.
 *
 * Intended for use by the Botpress engineering team only (e.g. running benchmarks
 * against arbitrary models). It is intentionally undocumented and offers no stability
 * guarantees — the API may change or be removed without notice. Avoid it unless you
 * fully understand the implications.
 */
export abstract class _CustomModelClient implements RuntimeCognitive {
  private readonly ['$$COGNITIVE'] = 'runtime' as const

  public static isCustomClient(obj: any): obj is _CustomModelClient {
    return obj instanceof _CustomModelClient || (obj as _CustomModelClient)?.['$$COGNITIVE'] === 'runtime'
  }

  public abstract getModelDetails(model: string): Promise<Model>
  public abstract generateContent(input: RuntimeGenerateContentInput): Promise<RuntimeGenerateContentOutput>
}
