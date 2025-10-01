export const liveModels = {
  'openai:gpt-5-2025-08-07': {
    input: {
      maxTokens: 400000,
      costPer1MTokens: 1.25,
    },
    output: {
      maxTokens: 128000,
      costPer1MTokens: 10,
    },
    tags: ['recommended', 'reasoning', 'general-purpose'],
  },
  'openai:gpt-5-mini-2025-08-07': {
    input: {
      maxTokens: 400000,
      costPer1MTokens: 0.25,
    },
    output: {
      maxTokens: 128000,
      costPer1MTokens: 2,
    },
    tags: ['recommended', 'reasoning', 'general-purpose'],
  },
  'openai:gpt-5-nano-2025-08-07': {
    input: {
      maxTokens: 400000,
      costPer1MTokens: 0.05,
    },
    output: {
      maxTokens: 128000,
      costPer1MTokens: 0.4,
    },
    tags: ['low-cost', 'reasoning', 'general-purpose'],
  },
  'openai:o4-mini-2025-04-16': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 1.1,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 4.4,
    },
    tags: ['reasoning', 'vision', 'coding'],
  },
  'openai:o3-2025-04-16': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 2,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 8,
    },
    tags: ['reasoning', 'vision', 'coding'],
  },
  'openai:gpt-4.1-2025-04-14': {
    input: {
      maxTokens: 1047576,
      costPer1MTokens: 2,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 8,
    },
    tags: ['recommended', 'vision', 'general-purpose'],
  },
  'openai:gpt-4.1-mini-2025-04-14': {
    input: {
      maxTokens: 1047576,
      costPer1MTokens: 0.4,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 1.6,
    },
    tags: ['recommended', 'vision', 'general-purpose'],
  },
  'openai:gpt-4.1-nano-2025-04-14': {
    input: {
      maxTokens: 1047576,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.4,
    },
    tags: ['low-cost', 'vision', 'general-purpose'],
  },
  'openai:o3-mini-2025-01-31': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 1.1,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 4.4,
    },
    tags: ['reasoning', 'general-purpose', 'coding'],
  },
  'openai:o1-2024-12-17': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 15,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 60,
    },
    tags: ['reasoning', 'vision', 'general-purpose'],
  },
  'openai:o1-mini-2024-09-12': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 1.1,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 4.4,
    },
    tags: ['reasoning', 'vision', 'general-purpose'],
  },
  'openai:gpt-4o-mini-2024-07-18': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.6,
    },
    tags: ['recommended', 'vision', 'low-cost', 'general-purpose', 'function-calling'],
  },
  'openai:gpt-4o-2024-11-20': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 2.5,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 10,
    },
    tags: ['recommended', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
  },
  'anthropic:claude-sonnet-4-20250514': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 64000,
      costPer1MTokens: 15,
    },
    tags: ['recommended', 'reasoning', 'agents', 'vision', 'general-purpose', 'coding'],
  },
  'anthropic:claude-3-7-sonnet-20250219': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 64000,
      costPer1MTokens: 15,
    },
    tags: ['recommended', 'reasoning', 'agents', 'vision', 'general-purpose', 'coding'],
  },
  'anthropic:claude-3-5-haiku-20241022': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 0.8,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 4,
    },
    tags: ['general-purpose', 'low-cost'],
  },
  'anthropic:claude-3-5-sonnet-20241022': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 15,
    },
    tags: ['vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
  },
  'anthropic:claude-3-5-sonnet-20240620': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 15,
    },
    tags: ['vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
  },
  'anthropic:claude-3-haiku-20240307': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 0.25,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 1.25,
    },
    tags: ['low-cost', 'general-purpose'],
  },
  'google-ai:gemini-2.5-flash': {
    input: {
      maxTokens: 1048576,
      costPer1MTokens: 0.3,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 2.5,
    },
    tags: ['recommended', 'reasoning', 'agents', 'general-purpose', 'vision'],
  },
  'google-ai:gemini-2.5-pro': {
    input: {
      maxTokens: 200000,
      costPer1MTokens: 1.25,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 10,
    },
    tags: ['recommended', 'reasoning', 'agents', 'general-purpose', 'vision', 'coding'],
  },
  'google-ai:models/gemini-2.0-flash': {
    input: {
      maxTokens: 1048576,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.4,
    },
    tags: ['low-cost', 'general-purpose', 'vision'],
  },
  'cerebras:gpt-oss-120b': {
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.35,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.75,
    },
    tags: ['preview', 'general-purpose', 'reasoning'],
  },
  'cerebras:qwen-3-32b': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.4,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.8,
    },
    tags: ['general-purpose', 'reasoning'],
  },
  'cerebras:llama-4-scout-17b-16e-instruct': {
    input: {
      maxTokens: 32000,
      costPer1MTokens: 0.65,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.85,
    },
    tags: ['general-purpose', 'vision'],
  },
  'cerebras:llama3.1-8b': {
    input: {
      maxTokens: 32000,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.1,
    },
    tags: ['low-cost', 'general-purpose'],
  },
  'cerebras:llama3.3-70b': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.85,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 1.2,
    },
    tags: ['general-purpose'],
  },
  'groq:openai/gpt-oss-20b': {
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 32000,
      costPer1MTokens: 0.5,
    },
    tags: ['preview', 'general-purpose', 'reasoning', 'low-cost'],
  },
  'groq:openai/gpt-oss-120b': {
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 32000,
      costPer1MTokens: 0.75,
    },
    tags: ['preview', 'general-purpose', 'reasoning'],
  },
  'groq:deepseek-r1-distill-llama-70b': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.75,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.99,
    },
    tags: ['general-purpose', 'reasoning', 'preview'],
  },
  'groq:llama-3.3-70b-versatile': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.59,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.79,
    },
    tags: ['recommended', 'general-purpose', 'coding'],
  },
  'groq:llama-3.1-8b-instant': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.05,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.08,
    },
    tags: ['low-cost', 'general-purpose'],
  },
  'groq:gemma2-9b-it': {
    input: {
      maxTokens: 8192,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.2,
    },
    tags: ['low-cost', 'general-purpose'],
  },
  'openrouter:gpt-oss-120b': {
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 32000,
      costPer1MTokens: 0.75,
    },
    tags: ['preview', 'general-purpose', 'reasoning'],
  },
  'fireworks:gpt-oss-20b': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.07,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.3,
    },
    tags: ['general-purpose', 'reasoning', 'low-cost'],
  },
  'fireworks:gpt-oss-120b': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.6,
    },
    tags: ['general-purpose', 'reasoning'],
  },
  'fireworks:deepseek-r1-0528': {
    input: {
      maxTokens: 160000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 8,
    },
    tags: ['recommended', 'reasoning', 'general-purpose', 'coding'],
  },
  'fireworks:deepseek-v3-0324': {
    input: {
      maxTokens: 160000,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.9,
    },
    tags: ['recommended', 'general-purpose'],
  },
  'fireworks:llama4-maverick-instruct-basic': {
    input: {
      maxTokens: 1000000,
      costPer1MTokens: 0.22,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.88,
    },
    tags: ['general-purpose', 'vision'],
  },
  'fireworks:llama4-scout-instruct-basic': {
    input: {
      maxTokens: 1048576,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.6,
    },
    tags: ['general-purpose', 'vision'],
  },
  'fireworks:llama-v3p3-70b-instruct': {
    input: {
      maxTokens: 131072,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.9,
    },
    tags: ['general-purpose'],
  },
  'fireworks:deepseek-r1': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 8,
    },
    tags: ['reasoning', 'general-purpose', 'coding'],
  },
  'fireworks:deepseek-r1-basic': {
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.55,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 2.19,
    },
    tags: ['recommended', 'reasoning', 'general-purpose', 'coding'],
  },
  'fireworks:llama-v3p1-8b-instruct': {
    input: {
      maxTokens: 131072,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 131072,
      costPer1MTokens: 0.2,
    },
    tags: ['low-cost', 'general-purpose'],
  },
  'fireworks:mixtral-8x22b-instruct': {
    input: {
      maxTokens: 65536,
      costPer1MTokens: 1.2,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 1.2,
    },
    tags: ['general-purpose'],
  },
  'fireworks:mixtral-8x7b-instruct': {
    input: {
      maxTokens: 32768,
      costPer1MTokens: 0.5,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.5,
    },
    tags: ['low-cost', 'general-purpose'],
  },
  'fireworks:mythomax-l2-13b': {
    input: {
      maxTokens: 4096,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 0.2,
    },
    tags: ['roleplay', 'storytelling', 'low-cost'],
  },
}
export const knownTags = [
  'auto',
  'best',
  'fast',
  'reasoning',
  'cheapest',
  'balance',
  'recommended',
  'reasoning',
  'general-purpose',
  'low-cost',
  'vision',
  'coding',
  'function-calling',
  'agents',
  'storytelling',
  'preview',
  'roleplay',
]
