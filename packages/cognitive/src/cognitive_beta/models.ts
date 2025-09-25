type Models =
  | 'auto'
  | 'auto-best'
  | 'auto-fast'
  | 'auto-reasoning'
  | 'auto-cheapest'
  | 'auto-balance'
  | 'anthropic:claude-3-5-haiku-20241022'
  | 'anthropic:claude-3-5-sonnet-20240620'
  | 'anthropic:claude-3-5-sonnet-20241022'
  | 'anthropic:claude-3-7-sonnet-20250219'
  | 'anthropic:claude-3-haiku-20240307'
  | 'anthropic:claude-sonnet-4-20250514'
  | 'cerebras:gpt-oss-120b'
  | 'cerebras:llama-4-scout-17b-16e-instruct'
  | 'cerebras:llama3.1-8b'
  | 'cerebras:llama3.3-70b'
  | 'cerebras:qwen-3-32b'
  | 'google-ai:gemini-2.5-flash'
  | 'google-ai:gemini-2.5-pro'
  | 'google-ai:models/gemini-2.0-flash'
  | 'groq:openai/gpt-oss-120b'
  | 'groq:openai/gpt-oss-20b'
  | 'openai:gpt-4.1-2025-04-14'
  | 'openai:gpt-4.1-mini-2025-04-14'
  | 'openai:gpt-4.1-nano-2025-04-14'
  | 'openai:gpt-4o-2024-11-20'
  | 'openai:gpt-4o-mini-2024-07-18'
  | 'openai:gpt-5-2025-08-07'
  | 'openai:gpt-5-mini-2025-08-07'
  | 'openai:gpt-5-nano-2025-08-07'
  | 'openai:o1-2024-12-17'
  | 'openai:o1-mini-2024-09-12'
  | 'openai:o3-2025-04-16'
  | 'openai:o3-mini-2025-01-31'
  | 'openai:o4-mini-2025-04-16'
  | 'openrouter:gpt-oss-120b'
  | ({} & string)

export type CognitiveRequest = {
  /**
   * @minItems 1
   */
  messages: {
    role: 'user' | 'assistant' | 'system'
    content:
      | string
      | {
          type: 'text' | 'image'
          text?: string
          url?: string
          mimeType?: string
          [k: string]: any
        }[]
    type?: string
  }[]
  /**
   * Model to query. Additional models are used as fallback if the main model is unavailable
   */
  model?: Models | Models[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stopSequences?: string | string[]
  stream?: boolean
  responseFormat?: 'text' | 'json'
  reasoningEffort?: 'low' | 'medium' | 'high'
}
export type CognitiveStreamChunk = {
  output?: string
  created: number
  finished?: boolean
  metadata?: {
    provider: string
    model?: string
    usage: {
      inputTokens: number
      outputTokens: number
      reasoningTokens?: number
    }
    cost?: number
    cached?: boolean
    latency?: number
    stopReason?: string
    reasoningEffort?: string
    warnings?: {
      type: 'parameter_ignored' | 'provider_limitation' | 'deprecated_model' | 'fallback_used'
      message: string
    }[]
    /**
     * List of models that were tried and failed
     */
    fallbackPath?: string[]
    debug?: {
      [k: string]: string
    }
  }
}
export type CognitiveResponse = {
  output: string
  metadata: {
    provider: string
    model?: string
    usage: {
      inputTokens: number
      outputTokens: number
      reasoningTokens?: number
    }
    cost?: number
    cached?: boolean
    latency?: number
    stopReason?: string
    reasoningEffort?: string
    warnings?: {
      type: 'parameter_ignored' | 'provider_limitation' | 'deprecated_model' | 'fallback_used'
      message: string
    }[]
    /**
     * List of models that were tried and failed
     */
    fallbackPath?: string[]
    debug?: {
      [k: string]: string
    }
  }
  error?: string
}
export type Model = {
  id: string
  name: string
  description: string
  tags?: (
    | 'recommended'
    | 'deprecated'
    | 'general-purpose'
    | 'low-cost'
    | 'flagship'
    | 'vision'
    | 'coding'
    | 'agents'
    | 'function-calling'
    | 'roleplay'
    | 'storytelling'
    | 'reasoning'
    | 'preview'
  )[]
  input: {
    maxTokens: number
    /**
     * Cost per 1 million tokens, in U.S. dollars
     */
    costPer1MTokens: number
  }
  output: {
    maxTokens: number
    /**
     * Cost per 1 million tokens, in U.S. dollars
     */
    costPer1MTokens: number
  }
}
