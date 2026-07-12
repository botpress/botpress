import { Model } from '@botpress/cognitive'
import { RuntimeCognitive } from './runtime/types.js'

export type RuntimeGenerateContentInput = Parameters<RuntimeCognitive['generateContent']>[0]
export type RuntimeGenerateContentOutput = Awaited<ReturnType<RuntimeCognitive['generateContent']>>

export abstract class CustomClient implements RuntimeCognitive {
  public readonly ['$$COGNITIVE'] = 'runtime' as const

  public static isCustomClient(obj: any): obj is CustomClient {
    return obj instanceof CustomClient || obj?.['$$COGNITIVE'] === 'runtime'
  }

  public abstract getModelDetails(model: string): Promise<Model>
  public abstract generateContent(input: RuntimeGenerateContentInput): Promise<RuntimeGenerateContentOutput>
}
