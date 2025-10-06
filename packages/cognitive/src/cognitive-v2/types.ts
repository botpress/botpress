type Models =
  | 'auto'
  | 'best'
  | 'fast'
  | 'reasoning'
  | 'cheapest'
  | 'balance'
  | 'recommended'
  | 'reasoning'
  | 'general-purpose'
  | 'low-cost'
  | 'vision'
  | 'coding'
  | 'function-calling'
  | 'agents'
  | 'storytelling'
  | 'preview'
  | 'roleplay'
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
  | 'fireworks-ai:deepseek-r1'
  | 'fireworks-ai:deepseek-r1-0528'
  | 'fireworks-ai:deepseek-r1-basic'
  | 'fireworks-ai:deepseek-v3-0324'
  | 'fireworks-ai:gpt-oss-120b'
  | 'fireworks-ai:gpt-oss-20b'
  | 'fireworks-ai:llama-v3p1-8b-instruct'
  | 'fireworks-ai:llama-v3p3-70b-instruct'
  | 'fireworks-ai:llama4-maverick-instruct-basic'
  | 'fireworks-ai:llama4-scout-instruct-basic'
  | 'fireworks-ai:mixtral-8x22b-instruct'
  | 'fireworks-ai:mixtral-8x7b-instruct'
  | 'fireworks-ai:mythomax-l2-13b'
  | 'google-ai:gemini-2.5-flash'
  | 'google-ai:gemini-2.5-pro'
  | 'google-ai:models/gemini-2.0-flash'
  | 'groq:deepseek-r1-distill-llama-70b'
  | 'groq:gemma2-9b-it'
  | 'groq:llama-3.1-8b-instant'
  | 'groq:llama-3.3-70b-versatile'
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
  | 'xai:grok-3'
  | 'xai:grok-3-mini'
  | 'xai:grok-4-0709'
  | 'xai:grok-4-fast-non-reasoning'
  | 'xai:grok-4-fast-reasoning'
  | 'xai:grok-code-fast-1'
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
  responseFormat?: 'text' | 'json' | 'json_object'
  reasoningEffort?: 'low' | 'medium' | 'high' | 'dynamic' | 'none'
  meta?: {
    /**
     * Source of the prompt, e.g. agent/:id/:version cards/ai-generate, cards/ai-task, nodes/autonomous, etc.
     */
    promptSource?: string
    promptCategory?: string
    /**
     * Name of the integration that originally received the message that initiated this action
     */
    integrationName?: string
  }
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
      inputCost: number
      outputTokens: number
      outputCost: number
    }
    cost?: number
    cached?: boolean
    /**
     * Time it took for the provider to respond to the LLM query
     */
    latency?: number
    stopReason?: 'stop' | 'length' | 'content_filter' | 'error'
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
  /**
   * Aliases that are also resolving to this model
   */
  aliases?: string[]
  tags: (
    | 'recommended'
    | 'deprecated'
    | 'general-purpose'
    | 'low-cost'
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
  /**
   * The lifecycle state of the model. Deprecated models are still available, but a warning will be shown to the user. Discontinued models will be directed to a replacement model.
   */
  lifecycle: 'live' | 'beta' | 'deprecated' | 'discontinued'
}
