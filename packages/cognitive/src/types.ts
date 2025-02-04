import { type GenerateContentInput, type GenerateContentOutput } from './llm'
import { ModelProvider, ModelRef } from './models'

export type BotpressClientLike = {
  callAction(...params: any): Promise<any>
  config: any
  constructor: Function
}

export type GenerationMetadata = {
  cached: boolean
  model: string
  cost: {
    input: number
    output: number
  }
  latency: number
  tokens: {
    input: number
    output: number
  }
}

export type InputProps = Omit<GenerateContentInput, 'model'> & {
  model?: 'best' | 'fast' | ModelRef
  signal?: AbortSignal
}

export type Request = {
  input: InputProps
}

export type Response = {
  output: GenerateContentOutput
  meta: {
    cached?: boolean
    model: { integration: string; model: string }
    latency: number
    cost: { input: number; output: number }
    tokens: { input: number; output: number }
  }
}

export type CognitiveProps = {
  client: BotpressClientLike
  provider?: ModelProvider
}

export type Events = {
  aborted: (req: Request, reason?: string) => void
  request: (req: Request) => void
  response: (req: Request, res: Response) => void
  error: (req: Request, error: any) => void
  retry: (req: Request, error: any) => void
  fallback: (req: Request, error: any) => void
}
