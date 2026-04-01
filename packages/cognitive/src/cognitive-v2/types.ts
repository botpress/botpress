export type Models =
  | 'auto'
  | 'best'
  | 'fast'
  | 'anthropic:claude-haiku-4-5-20251001'
  | 'anthropic:claude-haiku-4-5-reasoning-20251001'
  | 'anthropic:claude-opus-4-6'
  | 'anthropic:claude-sonnet-4-20250514'
  | 'anthropic:claude-sonnet-4-5-20250929'
  | 'anthropic:claude-sonnet-4-6'
  | 'cerebras:gpt-oss-120b'
  | 'cerebras:llama-4-scout-17b-16e-instruct'
  | 'cerebras:llama3.1-8b'
  | 'cerebras:llama3.3-70b'
  | 'cerebras:qwen-3-32b'
  | 'fireworks-ai:deepseek-r1-0528'
  | 'fireworks-ai:deepseek-v3-0324'
  | 'fireworks-ai:gpt-oss-120b'
  | 'fireworks-ai:gpt-oss-20b'
  | 'fireworks-ai:llama-v3p1-8b-instruct'
  | 'fireworks-ai:llama-v3p3-70b-instruct'
  | 'fireworks-ai:llama4-maverick-instruct-basic'
  | 'fireworks-ai:llama4-scout-instruct-basic'
  | 'google-ai:gemini-2.0-flash'
  | 'google-ai:gemini-2.5-flash'
  | 'google-ai:gemini-2.5-pro'
  | 'google-ai:gemini-3-flash'
  | 'google-ai:gemini-3-pro'
  | 'groq:gpt-oss-120b'
  | 'groq:gpt-oss-20b'
  | 'groq:llama-3.1-8b-instant'
  | 'groq:llama-3.3-70b-versatile'
  | 'openai:gpt-4.1-2025-04-14'
  | 'openai:gpt-4.1-mini-2025-04-14'
  | 'openai:gpt-4.1-nano-2025-04-14'
  | 'openai:gpt-4o-2024-11-20'
  | 'openai:gpt-4o-mini-2024-07-18'
  | 'openai:gpt-5-2025-08-07'
  | 'openai:gpt-5-mini-2025-08-07'
  | 'openai:gpt-5-nano-2025-08-07'
  | 'openai:gpt-5.1-2025-11-13'
  | 'openai:gpt-5.2-2025-12-11'
  | 'openai:gpt-5.4-2026-03-05'
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
  | 'openai:gpt-5.4'
  | 'openai:gpt-5'
  | 'openai:gpt-5-mini'
  | 'openai:gpt-5-nano'
  | 'openai:o4-mini'
  | 'openai:o3'
  | 'openai:gpt-4.1'
  | 'openai:gpt-4.1-mini'
  | 'openai:gpt-4.1-nano'
  | 'openai:o3-mini'
  | 'openai:o1-mini'
  | 'openai:gpt-4o-mini'
  | 'openai:gpt-4o'
  | 'anthropic:claude-sonnet-4-5'
  | 'anthropic:claude-sonnet-4'
  | 'anthropic:claude-sonnet-4-reasoning'
  | 'anthropic:claude-haiku-4-5'
  | 'anthropic:claude-haiku-4-5-reasoning'
  | 'google-ai:gemini-3.1-pro-preview'
  | 'google-ai:gemini-3-flash-preview'
  | 'google-ai:models/gemini-2.0-flash'
  | 'groq:openai/gpt-oss-20b'
  | 'groq:openai/gpt-oss-120b'
  | 'fireworks-ai:accounts/fireworks/models/gpt-oss-20b'
  | 'fireworks-ai:accounts/fireworks/models/gpt-oss-120b'
  | 'fireworks-ai:accounts/fireworks/models/deepseek-r1-0528'
  | 'fireworks-ai:accounts/fireworks/models/deepseek-v3-0324'
  | 'fireworks-ai:accounts/fireworks/models/llama4-maverick-instruct-basic'
  | 'fireworks-ai:accounts/fireworks/models/llama4-scout-instruct-basic'
  | 'fireworks-ai:accounts/fireworks/models/llama-v3p3-70b-instruct'
  | 'fireworks-ai:accounts/fireworks/models/deepseek-r1'
  | 'fireworks-ai:accounts/fireworks/models/deepseek-r1-basic'
  | 'fireworks-ai:accounts/fireworks/models/deepseek-v3'
  | 'fireworks-ai:accounts/fireworks/models/llama-v3p1-405b-instruct'
  | 'fireworks-ai:accounts/fireworks/models/llama-v3p1-70b-instruct'
  | 'fireworks-ai:accounts/fireworks/models/llama-v3p1-8b-instruct'
  | 'fireworks-ai:accounts/fireworks/models/mixtral-8x22b-instruct'
  | 'fireworks-ai:accounts/fireworks/models/mixtral-8x7b-instruct'
  | 'fireworks-ai:accounts/fireworks/models/mythomax-l2-13b'
  | 'fireworks-ai:accounts/fireworks/models/gemma2-9b-it'
  | ({} & string)
export type CognitiveContentPart = {
  type: 'text' | 'image' | 'audio'
  text?: string
  url?: string
  mimeType?: string
}

export type CognitiveToolCall = {
  id: string
  name: string
  input: Record<string, unknown>
}

export type CognitiveMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string | CognitiveContentPart[] | null
  type?: 'text' | 'tool_calls' | 'tool_result' | 'multipart'
  toolCalls?: {
    id: string
    type: 'function'
    function: { name: string; arguments: Record<string, unknown> | null }
  }[]
  toolResultCallId?: string
}

export type CognitiveTool = {
  name: string
  description?: string
  parameters?: Record<string, unknown>
  strict?: boolean
}

export type CognitiveToolControl =
  | { mode: 'auto'; parallel?: boolean }
  | { mode: 'none' }
  | { mode: 'required'; parallel?: boolean }
  | { mode: 'specific'; toolName: string; parallel?: boolean }

export type CommonRequestOptions = {
  /** Include additional metadata in the response */
  debug?: boolean
  /** Bypass the cache and force a new request */
  skipCache?: boolean
  /** Client-provided request ID. Acts as an idempotency key — if provided, the result is stored and a retry with the same ID returns the stored result instead of re-running the operation */
  requestId?: string
}

export type CognitiveRequest = {
  /**
   * @minItems 1
   */
  messages: CognitiveMessage[]
  /**
   * Model to query. Additional models are used as fallback if the main model is unavailable
   */
  model?: Models | Models[]
  temperature?: number
  /**
   * DEPRECATED: Use a message with role "system"
   */
  systemPrompt?: string
  maxTokens?: number
  stopSequences?: string | string[]
  stream?: boolean
  /**
   * json_object is deprecated, use json
   */
  responseFormat?: 'text' | 'json' | 'json_object'
  reasoningEffort?: 'low' | 'medium' | 'high' | 'dynamic' | 'none'
  /** Enable web search. The model can search the web and fetch pages to ground its response with real-time information. */
  search?:
    | true
    | {
        excludedDomains?: string[]
      }
  /** Tools the model may call */
  tools?: CognitiveTool[]
  /** Controls how the model uses tools. Defaults to auto when tools are provided */
  toolControl?: CognitiveToolControl
  options?: CommonRequestOptions & {
    /** Maximum time to wait for the first token before falling back to the next provider */
    maxTimeToFirstToken?: number
    /** STT model to use when transcribing audio parts for models that do not support audio natively */
    transcriptionModel?: string
  }
  meta?: {
    /** Source of the prompt, e.g. agent/:id/:version, cards/ai-generate, cards/ai-task, nodes/autonomous, etc. */
    promptSource?: string
    promptCategory?: string
    /** Name of the integration that originally received the message that initiated this action */
    integrationName?: string
  }
}

export type StopReason = 'stop' | 'max_tokens' | 'content_filter' | 'tool_calls' | 'other'

export type WarningType =
  | 'parameter_ignored'
  | 'provider_limitation'
  | 'deprecated_model'
  | 'discontinued_model'
  | 'fallback_used'
  | 'timeout'

export type CognitiveMetadata = {
  requestId?: string
  provider: string
  model?: string
  usage: {
    inputTokens: number
    inputCost: number
    outputTokens: number
    outputCost: number
  }
  /** Total cost of the request in U.S. dollars */
  cost: number
  cached?: boolean
  /** Time it took for the provider to respond to the LLM query, in milliseconds */
  latency?: number
  /** Time it took for the first token to be received from the provider, in milliseconds */
  ttft?: number
  /** Time spent on reasoning in milliseconds */
  reasoningTime?: number
  stopReason?: StopReason
  reasoningEffort?: string
  /** Web sources cited by the model when search is enabled */
  citations?: { url: string; title?: string }[]
  warnings?: { type: WarningType; message: string }[]
  /** List of models that were tried and failed before the successful one */
  fallbackPath?: string[]
  /** Present when audio content was transcribed to text before being sent to the LLM */
  transcription?: {
    /** Full STT model ID including provider (e.g. groq:whisper-large-v3-turbo) */
    model: string
    provider: string
    /** Transcription cost in U.S. dollars */
    cost: number
    /** Total audio duration transcribed in seconds */
    durationSeconds: number
    /** Number of audio parts transcribed */
    parts: number
  }
  debug?: { type: string; data?: unknown }[]
}

export type CognitiveStreamChunk = {
  output?: string
  reasoning?: string
  /** Tool calls requested by the model (emitted with the final chunk) */
  toolCalls?: CognitiveToolCall[]
  created: number
  finished?: boolean
  metadata?: CognitiveMetadata
}

export type CognitiveResponse = {
  output: string
  reasoning?: string
  /** Tool calls requested by the model */
  toolCalls?: CognitiveToolCall[]
  metadata: CognitiveMetadata
  error?: string
}

export type TranscribeRequest = {
  /** URL of the audio file to transcribe (supports http(s) URLs and data URIs) */
  url: string
  /** MIME type of the audio file. Auto-detected from URL if not provided. */
  mimeType?: string
  /** STT model or ordered list of models to try. Additional models are used as fallback. Defaults to cheapest available. */
  model?: string | (string | undefined)[]
  options?: CommonRequestOptions
}

/**
 * Transcription metadata. Picks shared fields from CognitiveMetadata and adds transcription-specific ones.
 */
export type TranscribeMetadata = Pick<
  CognitiveMetadata,
  'requestId' | 'provider' | 'cost' | 'latency' | 'cached' | 'fallbackPath' | 'debug'
> & {
  /** Full model ID including provider (e.g. groq:whisper-large-v3-turbo) */
  model: string
  /** Audio duration in seconds */
  durationSeconds: number
}

export type TranscribeResponse = {
  /** Transcribed text */
  output: string
  error?: string
  metadata: TranscribeMetadata
}

export type ModelTag =
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
  | 'speech-to-text'

export type Model = {
  id: string
  name: string
  description: string
  /**
   * Aliases that are also resolving to this model
   */
  aliases?: string[]
  tags?: ModelTag[]
  input: {
    maxTokens: number
    /**
     * Cost per 1 million tokens, in U.S. dollars
     */
    costPer1MTokens: number
    costPerMinute?: number
  }
  output: {
    maxTokens: number
    /**
     * Cost per 1 million tokens, in U.S. dollars
     */
    costPer1MTokens: number
    costPerMinute?: number
  }
  /**
   * The lifecycle state of the model. Deprecated models are still available, but a warning will be shown to the user. Discontinued models will be directed to a replacement model.
   */
  lifecycle: 'production' | 'preview' | 'deprecated' | 'discontinued'
  capabilities?: {
    supportsImages: boolean
    supportsAudio: boolean
    supportsTranscription: boolean
    supportsSearch: boolean
  }
}
