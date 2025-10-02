import { Model } from 'src/schemas.gen'

export type RemoteModel = Model & { aliases?: string[]; lifecycle: 'live' | 'beta' | 'deprecated' | 'discontinued' }

export const models: Record<string, RemoteModel> = {
  'openai:gpt-5-2025-08-07': {
    id: 'openai:gpt-5-2025-08-07',
    name: 'GPT-5',
    description:
      "GPT-5 is OpenAI's latest and most advanced AI model. It is a reasoning model that chooses the best way to respond based on task complexity and user intent. GPT-5 delivers expert-level performance across coding, math, writing, health, and visual perception, with improved accuracy, speed, and reduced hallucinations. It excels in complex tasks, long-context understanding, multimodal inputs (text and images), and safe, nuanced responses.",
    input: {
      maxTokens: 400000,
      costPer1MTokens: 1.25,
    },
    output: {
      maxTokens: 128000,
      costPer1MTokens: 10,
    },
    tags: ['recommended', 'reasoning', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:gpt-5-mini-2025-08-07': {
    id: 'openai:gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    description:
      'GPT-5 Mini is a lightweight and cost-effective version of GPT-5, optimized for applications where speed and efficiency matter more than full advanced capabilities. It is designed for cost-sensitive use cases such as chatbots, content generation, and high-volume usage, striking a balance between performance and affordability, making it suitable for simpler tasks that do not require deep multi-step reasoning or the full reasoning power of GPT-5',
    input: {
      maxTokens: 400000,
      costPer1MTokens: 0.25,
    },
    output: {
      maxTokens: 128000,
      costPer1MTokens: 2,
    },
    tags: ['recommended', 'reasoning', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:gpt-5-nano-2025-08-07': {
    id: 'openai:gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano',
    description:
      'GPT-5 Nano is an ultra-lightweight version of GPT-5 optimized for speed and very low latency, making it ideal for use cases like simple chatbots, basic content generation, summarization, and classification tasks.',
    input: {
      maxTokens: 400000,
      costPer1MTokens: 0.05,
    },
    output: {
      maxTokens: 128000,
      costPer1MTokens: 0.4,
    },
    tags: ['low-cost', 'reasoning', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:o4-mini-2025-04-16': {
    id: 'openai:o4-mini-2025-04-16',
    name: 'GPT o4-mini',
    description:
      "o4-mini is OpenAI's latest small o-series model. It's optimized for fast, effective reasoning with exceptionally efficient performance in coding and visual tasks.",
    input: {
      maxTokens: 200000,
      costPer1MTokens: 1.1,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 4.4,
    },
    tags: ['reasoning', 'vision', 'coding'],
    lifecycle: 'live',
  },
  'openai:o3-2025-04-16': {
    id: 'openai:o3-2025-04-16',
    name: 'GPT o3',
    description:
      'o3 is a well-rounded and powerful model across domains. It sets a new standard for math, science, coding, and visual reasoning tasks. It also excels at technical writing and instruction-following.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 2,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 8,
    },
    tags: ['reasoning', 'vision', 'coding'],
    lifecycle: 'live',
  },
  'openai:gpt-4.1-2025-04-14': {
    id: 'openai:gpt-4.1-2025-04-14',
    name: 'GPT 4.1',
    description:
      'GPT 4.1 is our flagship model for complex tasks. It is well suited for problem solving across domains. The knowledge cutoff is June 2024.',
    input: {
      maxTokens: 1047576,
      costPer1MTokens: 2,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 8,
    },
    tags: ['recommended', 'vision', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:gpt-4.1-mini-2025-04-14': {
    id: 'openai:gpt-4.1-mini-2025-04-14',
    name: 'GPT 4.1 Mini',
    description:
      'GPT 4.1 mini provides a balance between intelligence, speed, and cost that makes it an attractive model for many use cases. The knowledge cutoff is June 2024.',
    input: {
      maxTokens: 1047576,
      costPer1MTokens: 0.4,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 1.6,
    },
    tags: ['recommended', 'vision', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:gpt-4.1-nano-2025-04-14': {
    id: 'openai:gpt-4.1-nano-2025-04-14',
    name: 'GPT 4.1 Nano',
    description: 'GPT-4.1 nano is the fastest, most cost-effective GPT 4.1 model. The knowledge cutoff is June 2024.',
    input: {
      maxTokens: 1047576,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.4,
    },
    tags: ['low-cost', 'vision', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:o3-mini-2025-01-31': {
    id: 'openai:o3-mini-2025-01-31',
    name: 'GPT o3-mini',
    description:
      'o3-mini is the most recent small reasoning model from OpenAI, providing high intelligence at the same cost and latency targets of o1-mini. Also supports key developer features like Structured Outputs and function calling.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 1.1,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 4.4,
    },
    tags: ['reasoning', 'general-purpose', 'coding'],
    lifecycle: 'live',
  },
  'openai:o1-2024-12-17': {
    id: 'openai:o1-2024-12-17',
    name: 'GPT o1',
    description:
      'The o1 model is designed to solve hard problems across domains. Trained with reinforcement learning to perform complex reasoning with a long internal chain of thought.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 15,
    },
    output: {
      maxTokens: 100000,
      costPer1MTokens: 60,
    },
    tags: ['reasoning', 'vision', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:o1-mini-2024-09-12': {
    id: 'openai:o1-mini-2024-09-12',
    name: 'GPT o1-mini',
    description:
      'The o1-mini model is a fast and affordable reasoning model for specialized tasks. Trained with reinforcement learning to perform complex reasoning.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 1.1,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 4.4,
    },
    tags: ['reasoning', 'vision', 'general-purpose'],
    lifecycle: 'live',
  },
  'openai:gpt-4o-mini-2024-07-18': {
    id: 'openai:gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini',
    description:
      "GPT-4o mini is OpenAI's most advanced model in the small models category, and their cheapest model yet. Multimodal with higher intelligence than gpt-3.5-turbo but just as fast.",
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.6,
    },
    tags: ['recommended', 'vision', 'low-cost', 'general-purpose', 'function-calling'],
    lifecycle: 'live',
  },
  'openai:gpt-4o-2024-11-20': {
    id: 'openai:gpt-4o-2024-11-20',
    name: 'GPT-4o (November 2024)',
    description:
      "GPT-4o is OpenAI's most advanced model. Multimodal with the same high intelligence as GPT-4 Turbo but cheaper and more efficient.",
    input: {
      maxTokens: 128000,
      costPer1MTokens: 2.5,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 10,
    },
    tags: ['recommended', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    lifecycle: 'live',
  },
  'openai:gpt-4o-2024-08-06': {
    id: 'openai:gpt-4o-2024-08-06',
    name: 'GPT-4o (August 2024)',
    description:
      "GPT-4o is OpenAI's most advanced model. Multimodal with the same high intelligence as GPT-4 Turbo but cheaper and more efficient.",
    input: {
      maxTokens: 128000,
      costPer1MTokens: 2.5,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 10,
    },
    tags: ['deprecated', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    lifecycle: 'deprecated',
  },
  'openai:gpt-4o-2024-05-13': {
    id: 'openai:gpt-4o-2024-05-13',
    name: 'GPT-4o (May 2024)',
    description:
      "GPT-4o is OpenAI's most advanced model. Multimodal with the same high intelligence as GPT-4 Turbo but cheaper and more efficient.",
    input: {
      maxTokens: 128000,
      costPer1MTokens: 5,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 15,
    },
    tags: ['deprecated', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    lifecycle: 'deprecated',
  },
  'openai:gpt-4-turbo-2024-04-09': {
    id: 'openai:gpt-4-turbo-2024-04-09',
    name: 'GPT-4 Turbo',
    description:
      'GPT-4 is a large multimodal model that can solve difficult problems with greater accuracy than previous models, thanks to its broader general knowledge and advanced reasoning capabilities.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 10,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 30,
    },
    tags: ['deprecated', 'general-purpose', 'coding', 'agents', 'function-calling'],
    lifecycle: 'deprecated',
  },
  'openai:gpt-3.5-turbo-0125': {
    id: 'openai:gpt-3.5-turbo-0125',
    name: 'GPT-3.5 Turbo',
    description:
      'GPT-3.5 Turbo can understand and generate natural language or code and has been optimized for chat but works well for non-chat tasks as well.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.5,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 1.5,
    },
    tags: ['deprecated', 'general-purpose', 'low-cost'],
    lifecycle: 'deprecated',
  },
  'anthropic:claude-sonnet-4-20250514': {
    id: 'anthropic:claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description:
      'Claude Sonnet 4 significantly enhances the capabilities of its predecessor, Sonnet 3.7, excelling in both coding and reasoning tasks with improved precision and controllability. Sonnet 4 balances capability and computational efficiency, making it suitable for a broad range of applications from routine coding tasks to complex software development projects. Key enhancements include improved autonomous codebase navigation, reduced error rates in agent-driven workflows, and increased reliability in following intricate instructions.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 64000,
      costPer1MTokens: 15,
    },
    tags: ['recommended', 'reasoning', 'agents', 'vision', 'general-purpose', 'coding'],
    lifecycle: 'live',
  },
  'anthropic:claude-sonnet-4-reasoning-20250514': {
    id: 'anthropic:claude-sonnet-4-reasoning-20250514',
    name: 'Claude Sonnet 4 (Reasoning Mode)',
    description:
      'This model uses the "Extended Thinking" mode and will use a significantly higher amount of output tokens than the Standard Mode, so this model should only be used for tasks that actually require it.\n\nClaude Sonnet 4 significantly enhances the capabilities of its predecessor, Sonnet 3.7, excelling in both coding and reasoning tasks with improved precision and controllability.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 64000,
      costPer1MTokens: 15,
    },
    tags: ['deprecated', 'vision', 'reasoning', 'general-purpose', 'agents', 'coding'],
    lifecycle: 'deprecated',
  },
  'anthropic:claude-3-7-sonnet-20250219': {
    id: 'anthropic:claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description:
      'Claude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. The model demonstrates notable improvements in coding, particularly in front-end development and full-stack updates, and excels in agentic workflows, where it can autonomously navigate multi-step processes.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 64000,
      costPer1MTokens: 15,
    },
    tags: ['recommended', 'reasoning', 'agents', 'vision', 'general-purpose', 'coding'],
    lifecycle: 'live',
  },
  'anthropic:claude-3-7-sonnet-reasoning-20250219': {
    id: 'anthropic:claude-3-7-sonnet-reasoning-20250219',
    name: 'Claude 3.7 Sonnet (Reasoning Mode)',
    description:
      'This model uses the "Extended Thinking" mode and will use a significantly higher amount of output tokens than the Standard Mode, so this model should only be used for tasks that actually require it.\n\nClaude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 64000,
      costPer1MTokens: 15,
    },
    tags: ['deprecated', 'vision', 'reasoning', 'general-purpose', 'agents', 'coding'],
    lifecycle: 'deprecated',
  },
  'anthropic:claude-3-5-haiku-20241022': {
    id: 'anthropic:claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description:
      'Claude 3.5 Haiku features offers enhanced capabilities in speed, coding accuracy, and tool use. Engineered to excel in real-time applications, it delivers quick response times that are essential for dynamic tasks such as chat interactions and immediate coding suggestions.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 0.8,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 4,
    },
    tags: ['general-purpose', 'low-cost'],
    lifecycle: 'live',
  },
  'anthropic:claude-3-5-sonnet-20241022': {
    id: 'anthropic:claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet (October 2024)',
    description:
      'Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at coding, data science, visual processing, and agentic tasks.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 15,
    },
    tags: ['vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
    lifecycle: 'live',
  },
  'anthropic:claude-3-5-sonnet-20240620': {
    id: 'anthropic:claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet (June 2024)',
    description:
      'Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at coding, data science, visual processing, and agentic tasks.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 15,
    },
    tags: ['vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
    lifecycle: 'live',
  },
  'anthropic:claude-3-haiku-20240307': {
    id: 'anthropic:claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description:
      "Claude 3 Haiku is Anthropic's fastest and most compact model for near-instant responsiveness. Quick and accurate targeted performance.",
    input: {
      maxTokens: 200000,
      costPer1MTokens: 0.25,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 1.25,
    },
    tags: ['low-cost', 'general-purpose'],
    lifecycle: 'live',
  },
  'google-ai:gemini-2.5-flash': {
    id: 'google-ai:gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description:
      'Google\'s state-of-the-art workhorse model with advanced reasoning, coding, mathematics, and scientific capabilities. Includes built-in "thinking" capabilities for enhanced accuracy.',
    input: {
      maxTokens: 1048576,
      costPer1MTokens: 0.3,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 2.5,
    },
    tags: ['recommended', 'reasoning', 'agents', 'general-purpose', 'vision'],
    lifecycle: 'live',
  },
  'google-ai:gemini-2.5-pro': {
    id: 'google-ai:gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description:
      'Google\'s most advanced AI model designed for complex reasoning, coding, mathematics, and scientific tasks. Features "thinking" capabilities for superior human-preference alignment and problem-solving.',
    input: {
      maxTokens: 200000,
      costPer1MTokens: 1.25,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 10,
    },
    tags: ['recommended', 'reasoning', 'agents', 'general-purpose', 'vision', 'coding'],
    lifecycle: 'live',
  },
  'google-ai:models/gemini-2.0-flash': {
    id: 'google-ai:models/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description:
      'Next-gen Gemini model with improved capabilities, superior speed, native tool use, multimodal generation, and 1M token context window.',
    input: {
      maxTokens: 1048576,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.4,
    },
    tags: ['low-cost', 'general-purpose', 'vision'],
    lifecycle: 'live',
  },
  'cerebras:gpt-oss-120b': {
    id: 'cerebras:gpt-oss-120b',
    name: 'GPT-OSS 120B (Preview)',
    description:
      'gpt-oss-120b is a high-performance, open-weight language model designed for production-grade, general-purpose use cases. It excels at complex reasoning and supports configurable reasoning effort, full chain-of-thought transparency for easier debugging and trust, and native agentic capabilities for function calling, tool use, and structured outputs.',
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.35,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.75,
    },
    tags: ['preview', 'general-purpose', 'reasoning'],
    lifecycle: 'live',
  },
  'cerebras:qwen-3-32b': {
    id: 'cerebras:qwen-3-32b',
    name: 'Qwen3 32B',
    description:
      'Qwen3-32B is a world-class reasoning model with comparable quality to DeepSeek R1 while outperforming GPT-4.1 and Claude Sonnet 3.7. It excels in code-gen, tool-calling, and advanced reasoning, making it an exceptional model for a wide range of production use cases.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.4,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.8,
    },
    tags: ['general-purpose', 'reasoning'],
    lifecycle: 'live',
  },
  'cerebras:llama-4-scout-17b-16e-instruct': {
    id: 'cerebras:llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    description:
      'Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, uses 16 experts per forward pass, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages.',
    input: {
      maxTokens: 32000,
      costPer1MTokens: 0.65,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.85,
    },
    tags: ['general-purpose', 'vision'],
    lifecycle: 'live',
  },
  'cerebras:llama3.1-8b': {
    id: 'cerebras:llama3.1-8b',
    name: 'Llama 3.1 8B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    input: {
      maxTokens: 32000,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.1,
    },
    tags: ['low-cost', 'general-purpose'],
    lifecycle: 'live',
  },
  'cerebras:llama3.3-70b': {
    id: 'cerebras:llama3.3-70b',
    name: 'Llama 3.3 70B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.85,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 1.2,
    },
    tags: ['general-purpose'],
    lifecycle: 'live',
  },
  'groq:openai/gpt-oss-20b': {
    id: 'groq:openai/gpt-oss-20b',
    name: 'GPT-OSS 20B (Preview)',
    description:
      'gpt-oss-20b is a compact, open-weight language model optimized for low-latency. It shares the same training foundation and capabilities as the GPT-OSS 120B model, with faster responses and lower cost.',
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.1,
    },
    output: {
      maxTokens: 32000,
      costPer1MTokens: 0.5,
    },
    tags: ['preview', 'general-purpose', 'reasoning', 'low-cost'],
    lifecycle: 'live',
  },
  'groq:openai/gpt-oss-120b': {
    id: 'groq:openai/gpt-oss-120b',
    name: 'GPT-OSS 120B (Preview)',
    description:
      'gpt-oss-120b is a high-performance, open-weight language model designed for production-grade, general-purpose use cases. It excels at complex reasoning and supports configurable reasoning effort, full chain-of-thought transparency for easier debugging and trust, and native agentic capabilities for function calling, tool use, and structured outputs.',
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 32000,
      costPer1MTokens: 0.75,
    },
    tags: ['preview', 'general-purpose', 'reasoning'],
    lifecycle: 'live',
  },
  'groq:deepseek-r1-distill-llama-70b': {
    id: 'groq:deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1-Distill Llama 3.3 70B (Preview)',
    description:
      'A fine-tuned version of Llama 3.3 70B using samples generated by DeepSeek-R1, making it smarter than the original Llama 70B, particularly for tasks requiring mathematical and factual precision.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.75,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.99,
    },
    tags: ['general-purpose', 'reasoning', 'preview'],
    lifecycle: 'live',
  },
  'groq:llama-3.3-70b-versatile': {
    id: 'groq:llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 70B',
    description:
      'The Meta Llama 3.3 multilingual large language model (LLM) is a pretrained and instruction tuned generative model in 70B (text in/text out). The Llama 3.3 instruction tuned text only model is optimized for multilingual dialogue use cases and outperforms many of the available open source and closed chat models on common industry benchmarks.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.59,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.79,
    },
    tags: ['recommended', 'general-purpose', 'coding'],
    lifecycle: 'live',
  },
  'groq:llama-3.2-1b-preview': {
    id: 'groq:llama-3.2-1b-preview',
    name: 'LLaMA 3.2 1B (Preview)',
    description:
      'The Llama 3.2 instruction-tuned, text-only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.04,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.04,
    },
    tags: ['low-cost', 'deprecated'],
    lifecycle: 'discontinued',
  },
  'groq:llama-3.2-3b-preview': {
    id: 'groq:llama-3.2-3b-preview',
    name: 'LLaMA 3.2 3B (Preview)',
    description:
      'The Llama 3.2 instruction-tuned, text-only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.06,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.06,
    },
    tags: ['low-cost', 'general-purpose', 'deprecated'],
    lifecycle: 'discontinued',
  },
  'groq:llama-3.2-11b-vision-preview': {
    id: 'groq:llama-3.2-11b-vision-preview',
    name: 'LLaMA 3.2 11B Vision (Preview)',
    description:
      'The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.18,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.18,
    },
    tags: ['low-cost', 'vision', 'general-purpose', 'deprecated'],
    lifecycle: 'discontinued',
  },
  'groq:llama-3.2-90b-vision-preview': {
    id: 'groq:llama-3.2-90b-vision-preview',
    name: 'LLaMA 3.2 90B Vision (Preview)',
    description:
      'The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.9,
    },
    tags: ['vision', 'general-purpose', 'deprecated'],
    lifecycle: 'discontinued',
  },
  'groq:llama-3.1-8b-instant': {
    id: 'groq:llama-3.1-8b-instant',
    name: 'LLaMA 3.1 8B',
    description: 'The Llama 3.1 instruction-tuned, text-only models are optimized for multilingual dialogue use cases.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.05,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.08,
    },
    tags: ['low-cost', 'general-purpose'],
    lifecycle: 'live',
  },
  'groq:llama3-8b-8192': {
    id: 'groq:llama3-8b-8192',
    name: 'LLaMA 3 8B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8 and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    input: {
      maxTokens: 8192,
      costPer1MTokens: 0.05,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.08,
    },
    tags: ['low-cost', 'general-purpose', 'deprecated'],
    lifecycle: 'discontinued',
  },
  'groq:llama3-70b-8192': {
    id: 'groq:llama3-70b-8192',
    name: 'LLaMA 3 70B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8 and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    input: {
      maxTokens: 8192,
      costPer1MTokens: 0.59,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.79,
    },
    tags: ['general-purpose', 'deprecated'],
    lifecycle: 'discontinued',
  },
  'groq:gemma2-9b-it': {
    id: 'groq:gemma2-9b-it',
    name: 'Gemma2 9B',
    description:
      'Redesigned for outsized performance and unmatched efficiency, Gemma 2 optimizes for blazing-fast inference on diverse hardware. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.',
    input: {
      maxTokens: 8192,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.2,
    },
    tags: ['low-cost', 'general-purpose'],
    lifecycle: 'live',
  },
  'openrouter:gpt-oss-120b': {
    id: 'openrouter:gpt-oss-120b',
    name: 'GPT-OSS 120B (Preview)',
    description:
      'gpt-oss-120b is a high-performance, open-weight language model designed for production-grade, general-purpose use cases. It excels at complex reasoning and supports configurable reasoning effort, full chain-of-thought transparency for easier debugging and trust, and native agentic capabilities for function calling, tool use, and structured outputs.',
    input: {
      maxTokens: 131000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 32000,
      costPer1MTokens: 0.75,
    },
    tags: ['preview', 'general-purpose', 'reasoning'],
    lifecycle: 'live',
  },
  'fireworks:gpt-oss-20b': {
    id: 'fireworks:gpt-oss-20b',
    name: 'GPT-OSS 20B',
    description:
      'gpt-oss-20b is a compact, open-weight language model optimized for low-latency. It shares the same training foundation and capabilities as the GPT-OSS 120B model, with faster responses and lower cost.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.07,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.3,
    },
    tags: ['general-purpose', 'reasoning', 'low-cost'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/gpt-oss-20b'],
  },
  'fireworks:gpt-oss-120b': {
    id: 'fireworks:gpt-oss-120b',
    name: 'GPT-OSS 120B',
    description:
      'gpt-oss-120b is a high-performance, open-weight language model designed for production-grade, general-purpose use cases. It excels at complex reasoning and supports configurable reasoning effort, full chain-of-thought transparency for easier debugging and trust, and native agentic capabilities for function calling, tool use, and structured outputs.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 16000,
      costPer1MTokens: 0.6,
    },
    tags: ['general-purpose', 'reasoning'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/gpt-oss-120b'],
  },
  'fireworks:deepseek-r1-0528': {
    id: 'fireworks:deepseek-r1-0528',
    name: 'DeepSeek R1 0528',
    description:
      'The updated DeepSeek R1 0528 model delivers major improvements in reasoning, inference, and accuracy through enhanced post-training optimization and greater computational resources. It now performs at a level approaching top-tier models like OpenAI o3 and Gemini 2.5 Pro, with notable gains in complex tasks such as math and programming. The update also reduces hallucinations, improves function calling, and enhances the coding experience.',
    input: {
      maxTokens: 160000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 8,
    },
    tags: ['recommended', 'reasoning', 'general-purpose', 'coding'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/deepseek-r1-0528'],
  },
  'fireworks:deepseek-v3-0324': {
    id: 'fireworks:deepseek-v3-0324',
    name: 'DeepSeek V3 0324',
    description:
      'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team. It succeeds the DeepSeek V3 model and performs really well on a variety of tasks.',
    input: {
      maxTokens: 160000,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.9,
    },
    tags: ['recommended', 'general-purpose'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/deepseek-v3-0324'],
  },
  'fireworks:llama4-maverick-instruct-basic': {
    id: 'fireworks:llama4-maverick-instruct-basic',
    name: 'Llama 4 Maverick Instruct (Basic)',
    description:
      'Llama 4 Maverick 17B Instruct (128E) is a high-capacity multimodal language model from Meta, built on a mixture-of-experts (MoE) architecture with 128 experts and 17 billion active parameters per forward pass (400B total). It supports multilingual text and image input, and produces multilingual text and code output across 12 supported languages. Optimized for vision-language tasks, Maverick is instruction-tuned for assistant-like behavior, image reasoning, and general-purpose multimodal interaction, and suited for research and commercial applications requiring advanced multimodal understanding and high model throughput.',
    input: {
      maxTokens: 1000000,
      costPer1MTokens: 0.22,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.88,
    },
    tags: ['general-purpose', 'vision'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/llama4-maverick-instruct-basic'],
  },
  'fireworks:llama4-scout-instruct-basic': {
    id: 'fireworks:llama4-scout-instruct-basic',
    name: 'Llama 4 Scout Instruct (Basic)',
    description:
      'Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, uses 16 experts per forward pass, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages. Designed for assistant-style interaction and visual reasoning, it is instruction-tuned for use in multilingual chat, captioning, and image understanding tasks.',
    input: {
      maxTokens: 1048576,
      costPer1MTokens: 0.15,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.6,
    },
    tags: ['general-purpose', 'vision'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/llama4-scout-instruct-basic'],
  },
  'fireworks:llama-v3p3-70b-instruct': {
    id: 'fireworks:llama-v3p3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    description:
      'Llama 3.3 70B Instruct is the December update of Llama 3.1 70B. The model improves upon Llama 3.1 70B (released July 2024) with advances in tool calling, multilingual text support, math and coding. The model achieves industry leading results in reasoning, math and instruction following and provides similar performance as 3.1 405B but with significant speed and cost improvements.',
    input: {
      maxTokens: 131072,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 16384,
      costPer1MTokens: 0.9,
    },
    tags: ['general-purpose'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/llama-v3p3-70b-instruct'],
  },
  'fireworks:deepseek-r1': {
    id: 'fireworks:deepseek-r1',
    name: 'DeepSeek R1 (Fast)',
    description:
      'This version of the R1 model has a perfect balance between speed and cost-efficiency for real-time interactive experiences, with speeds up to 90 tokens per second.\n\nDeepSeek-R1 is a state-of-the-art large language model optimized with reinforcement learning and cold-start data for exceptional reasoning, math, and code performance. **Note**: This model will always use a temperature of 0.6 as recommended by DeepSeek.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 8,
    },
    tags: ['reasoning', 'general-purpose', 'coding'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/deepseek-r1'],
  },
  'fireworks:deepseek-r1-basic': {
    id: 'fireworks:deepseek-r1-basic',
    name: 'DeepSeek R1 (Basic)',
    description:
      'This version of the R1 model is optimized for throughput and cost-effectiveness and has a lower cost but slightly higher latency than the "Fast" version of the model.\n\nDeepSeek-R1 is a state-of-the-art large language model optimized with reinforcement learning and cold-start data for exceptional reasoning, math, and code performance. **Note**: This model will always use a temperature of 0.6 as recommended by DeepSeek.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.55,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 2.19,
    },
    tags: ['recommended', 'reasoning', 'general-purpose', 'coding'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/deepseek-r1-basic'],
  },
  'fireworks:deepseek-v3': {
    id: 'fireworks:deepseek-v3',
    name: 'DeepSeek V3',
    description:
      'A a strong Mixture-of-Experts (MoE) language model with 671B total parameters with 37B activated for each token from Deepseek.',
    input: {
      maxTokens: 128000,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 8000,
      costPer1MTokens: 0.9,
    },
    tags: ['deprecated', 'general-purpose'],
    lifecycle: 'deprecated',
    aliases: ['accounts/fireworks/models/deepseek-v3'],
  },
  'fireworks:llama-v3p1-405b-instruct': {
    id: 'fireworks:llama-v3p1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    input: {
      maxTokens: 131072,
      costPer1MTokens: 3,
    },
    output: {
      maxTokens: 131072,
      costPer1MTokens: 3,
    },
    tags: ['deprecated', 'general-purpose'],
    lifecycle: 'deprecated',
    aliases: ['accounts/fireworks/models/llama-v3p1-405b-instruct'],
  },
  'fireworks:llama-v3p1-70b-instruct': {
    id: 'fireworks:llama-v3p1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    input: {
      maxTokens: 131072,
      costPer1MTokens: 0.9,
    },
    output: {
      maxTokens: 131072,
      costPer1MTokens: 0.9,
    },
    tags: ['deprecated', 'general-purpose'],
    lifecycle: 'deprecated',
    aliases: ['accounts/fireworks/models/llama-v3p1-70b-instruct'],
  },
  'fireworks:llama-v3p1-8b-instruct': {
    id: 'fireworks:llama-v3p1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    input: {
      maxTokens: 131072,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 131072,
      costPer1MTokens: 0.2,
    },
    tags: ['low-cost', 'general-purpose'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/llama-v3p1-8b-instruct'],
  },
  'fireworks:mixtral-8x22b-instruct': {
    id: 'fireworks:mixtral-8x22b-instruct',
    name: 'Mixtral MoE 8x22B Instruct',
    description:
      'Mistral MoE 8x22B Instruct v0.1 model with Sparse Mixture of Experts. Fine tuned for instruction following.',
    input: {
      maxTokens: 65536,
      costPer1MTokens: 1.2,
    },
    output: {
      maxTokens: 65536,
      costPer1MTokens: 1.2,
    },
    tags: ['general-purpose'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/mixtral-8x22b-instruct'],
  },
  'fireworks:mixtral-8x7b-instruct': {
    id: 'fireworks:mixtral-8x7b-instruct',
    name: 'Mixtral MoE 8x7B Instruct',
    description:
      'Mistral MoE 8x7B Instruct v0.1 model with Sparse Mixture of Experts. Fine tuned for instruction following',
    input: {
      maxTokens: 32768,
      costPer1MTokens: 0.5,
    },
    output: {
      maxTokens: 32768,
      costPer1MTokens: 0.5,
    },
    tags: ['low-cost', 'general-purpose'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/mixtral-8x7b-instruct'],
  },
  'fireworks:mythomax-l2-13b': {
    id: 'fireworks:mythomax-l2-13b',
    name: 'MythoMax L2 13b',
    description:
      'MythoMax L2 is designed to excel at both roleplaying and storytelling, and is an improved variant of the previous MythoMix model, combining the MythoLogic-L2 and Huginn models.',
    input: {
      maxTokens: 4096,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 4096,
      costPer1MTokens: 0.2,
    },
    tags: ['roleplay', 'storytelling', 'low-cost'],
    lifecycle: 'live',
    aliases: ['accounts/fireworks/models/mythomax-l2-13b'],
  },
  'fireworks:gemma2-9b-it': {
    id: 'fireworks:gemma2-9b-it',
    name: 'Gemma 2 9B Instruct',
    description:
      'Redesigned for outsized performance and unmatched efficiency, Gemma 2 optimizes for blazing-fast inference on diverse hardware. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.',
    input: {
      maxTokens: 8192,
      costPer1MTokens: 0.2,
    },
    output: {
      maxTokens: 8192,
      costPer1MTokens: 0.2,
    },
    tags: ['deprecated', 'low-cost', 'general-purpose'],
    lifecycle: 'deprecated',
    aliases: ['accounts/fireworks/models/gemma2-9b-it'],
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

export const defaultModel: RemoteModel = {
  id: '',
  name: '',
  description: '',
  input: {
    costPer1MTokens: 0,
    maxTokens: 1000000,
  },
  output: {
    costPer1MTokens: 0,
    maxTokens: 1000000,
  },
  tags: [],
  lifecycle: 'live',
}
