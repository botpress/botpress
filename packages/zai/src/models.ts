// TODO: fetch model from API when instantiating Zai instead of hardcoding all models here
export const Models = [
  {
    id: 'anthropic__claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    integration: 'anthropic',
    input: {
      maxTokens: 200000,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'anthropic__claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    integration: 'anthropic',
    input: {
      maxTokens: 200000,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'cerebras__llama3.1-70b',
    name: 'Llama 3.1 70B',
    integration: 'cerebras',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'cerebras__llama3.1-8b',
    name: 'Llama 3.1 8B',
    integration: 'cerebras',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/deepseek-coder-v2-instruct',
    name: 'DeepSeek Coder V2 Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 131072,
    },
    output: {
      maxTokens: 131072,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/deepseek-coder-v2-lite-instruct',
    name: 'DeepSeek Coder V2 Lite',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 163840,
    },
    output: {
      maxTokens: 163840,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/firellava-13b',
    name: 'FireLLaVA-13B',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 4096,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/firefunction-v2',
    name: 'Firefunction V2',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/gemma2-9b-it',
    name: 'Gemma 2 9B Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/llama-v3p1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 131072,
    },
    output: {
      maxTokens: 131072,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/llama-v3p1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 131072,
    },
    output: {
      maxTokens: 131072,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/llama-v3p1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 131072,
    },
    output: {
      maxTokens: 131072,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/mixtral-8x22b-instruct',
    name: 'Mixtral MoE 8x22B Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 65536,
    },
    output: {
      maxTokens: 65536,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/mixtral-8x7b-instruct',
    name: 'Mixtral MoE 8x7B Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 32768,
    },
    output: {
      maxTokens: 32768,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/mythomax-l2-13b',
    name: 'MythoMax L2 13b',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 4096,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'fireworks-ai__accounts/fireworks/models/qwen2-72b-instruct',
    name: 'Qwen2 72b Instruct',
    integration: 'fireworks-ai',
    input: {
      maxTokens: 32768,
    },
    output: {
      maxTokens: 32768,
    },
  },
  {
    id: 'groq__gemma2-9b-it',
    name: 'Gemma2 9B',
    integration: 'groq',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama3-70b-8192',
    name: 'LLaMA 3 70B',
    integration: 'groq',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama3-8b-8192',
    name: 'LLaMA 3 8B',
    integration: 'groq',
    input: {
      maxTokens: 8192,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.1-70b-versatile',
    name: 'LLaMA 3.1 70B',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.1-8b-instant',
    name: 'LLaMA 3.1 8B',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.2-11b-vision-preview',
    name: 'LLaMA 3.2 11B Vision',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.2-1b-preview',
    name: 'LLaMA 3.2 1B',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.2-3b-preview',
    name: 'LLaMA 3.2 3B',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.2-90b-vision-preview',
    name: 'LLaMA 3.2 90B Vision',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 8192,
    },
  },
  {
    id: 'groq__llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 70B',
    integration: 'groq',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 32768,
    },
  },
  {
    id: 'groq__mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    integration: 'groq',
    input: {
      maxTokens: 32768,
    },
    output: {
      maxTokens: 32768,
    },
  },
  {
    id: 'openai__o1-2024-12-17',
    name: 'GPT o1',
    integration: 'openai',
    input: {
      maxTokens: 200000,
    },
    output: {
      maxTokens: 100000,
    },
  },
  {
    id: 'openai__o1-mini-2024-09-12',
    name: 'GPT o1-mini',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 65536,
    },
  },
  {
    id: 'openai__gpt-3.5-turbo-0125',
    name: 'GPT-3.5 Turbo',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'openai__gpt-4-turbo-2024-04-09',
    name: 'GPT-4 Turbo',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'openai__gpt-4o-2024-08-06',
    name: 'GPT-4o (August 2024)',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 16384,
    },
  },
  {
    id: 'openai__gpt-4o-2024-05-13',
    name: 'GPT-4o (May 2024)',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 4096,
    },
  },
  {
    id: 'openai__gpt-4o-2024-11-20',
    name: 'GPT-4o (November 2024)',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 16384,
    },
  },
  {
    id: 'openai__gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini',
    integration: 'openai',
    input: {
      maxTokens: 128000,
    },
    output: {
      maxTokens: 16384,
    },
  },
] as const
