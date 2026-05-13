import { ModelProvider, ModelRef } from './models'
import { type GenerateContentInput, type GenerateContentOutput } from './schemas.gen'

export type BotpressClientLike = {
  callAction(...params: any): Promise<any>
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

/**
 * Model selector accepted by `generateContent`.
 *
 * - `'best'` / `'auto'`: aliases. `'best'` is the original SDK selector;
 *   `'auto'` was added when cognitive-v2 landed (the v2 server uses that
 *   name). Both pick the first available entry from `preferences.best` on
 *   the legacy path, and are forwarded as-is on the v2 path.
 * - `'fast'`: same shape — first available from `preferences.fast` on the
 *   legacy path, forwarded on the v2 path.
 * - `ModelRef`: any `provider:model` string.
 */
export type InputModel = 'auto' | 'best' | 'fast' | ModelRef

export type InputProps = Omit<GenerateContentInput, 'model'> & {
  /**
   * Model to use, or an ordered list of fallback models. Ordered fallback is honored only on the cognitive-v2 path;
   * the legacy integration path uses the first entry and falls back to server-side preferences instead.
   */
  model?: InputModel | InputModel[]
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
  /** Timeout in milliseconds */
  timeout?: number
  /** Max retry attempts */
  maxRetries?: number
  /** Whether to use the beta client. Restricted to authorized users. */
  __experimental_beta?: boolean
  __debug?: boolean
}

export type Events = {
  aborted: (req: Request, reason?: string) => void
  request: (req: Request) => void
  response: (req: Request, res: Response) => void
  error: (req: Request, error: any) => void
  retry: (req: Request, error: any) => void
  fallback: (req: Request, error: any) => void
}
