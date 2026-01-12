import { llm } from '@botpress/common'
import { Mistral } from '@mistralai/mistralai'
import { generateContent } from './actions/generate-content'
import { DefaultModel, ModelId } from './schemas'
import * as bp from '.botpress'

const mistral = new Mistral({ apiKey: bp.secrets.MISTRAL_API_KEY })

const LanguageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference: https://docs.mistral.ai/getting-started/models
  'mistral-large-2512': {
    name: 'Mistral Large 3',
    description:
      'Mistral Large 3, is a state-of-the-art, open-weight, general-purpose multimodal model with a granular Mixture-of-Experts architecture. It features 41B active parameters and 675B total parameters.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.5,
      maxTokens: 256_000,
    },
    output: {
      costPer1MTokens: 1.5,
      maxTokens: 4096,
    },
  },
  'mistral-medium-2508': {
    name: 'Mistral Medium 3.1',
    description: 'Frontier-class multimodal model released August 2025. Improving tone and performance.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.4,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 2,
      maxTokens: 4096,
    },
  },
  'mistral-small-2506': {
    name: 'Mistral Small 3.2',
    description: 'An update to the previous small model, released June 2025.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.1,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.3,
      maxTokens: 4096,
    },
  },
  'ministral-14b-2512': {
    name: 'Ministral 3 14B',
    description:
      'Ministral 3 14B is the largest model in the Ministral 3 family, offering state-of-the-art capabilities and performance comparable to its larger Mistral Small 3.2 24B counterpart.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 256_000,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 4096,
    },
  },
  'ministral-8b-2512': {
    name: 'Ministral 3 8B',
    description:
      'Ministral 3 8B is a powerful and efficient model in the Ministral 3 family, offering best-in-class text and vision capabilities.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.15,
      maxTokens: 256_000,
    },
    output: {
      costPer1MTokens: 0.15,
      maxTokens: 4096,
    },
  },
  'ministral-3b-2512': {
    name: 'Ministral 3 3B',
    description:
      'Ministral 3 3B is the smallest and most efficient model in the Ministral 3 family, offering robust language and vision capabilities in a compact package.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.1,
      maxTokens: 256_000,
    },
    output: {
      costPer1MTokens: 0.1,
      maxTokens: 4096,
    },
  },
  'magistral-medium-2509': {
    name: 'Magistral Medium 1.2',
    description: 'Frontier-class multimodal reasoning model update of September 2025.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 2,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 5,
      maxTokens: 4096,
    },
  },
  'magistral-small-2509': {
    name: 'Magistral Small 1.2',
    description: 'Small multimodal reasoning model update of September 2025.',
    tags: [
      /* TODO: Add tags */
    ],
    input: {
      costPer1MTokens: 0.5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 1.5,
      maxTokens: 4096,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await generateContent(<llm.GenerateContentInput>input, mistral, logger, {
        models: LanguageModels,
        defaultModel: DefaultModel,
      })
      metadata.setCost(output.botpress.cost)
      return output
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(LanguageModels).map(([id, model]) => ({ id: <ModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})
