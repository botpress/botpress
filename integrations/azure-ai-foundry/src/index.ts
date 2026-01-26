import { llm } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import OpenAI from 'openai'
import { DEFAULT_MODEL_ID, LanguageModels, ModelId } from './schemas'
import * as bp from '.botpress'

const provider = 'Azure AI Foundry'

export default new bp.Integration({
  register: async ({ ctx }) => {
    const { baseUrl, apiKey } = ctx.configuration
    if (!baseUrl || !apiKey) {
      throw new sdk.RuntimeError('Both "Base URL" and "API Key" must be set in the integration configuration.')
    }
  },
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata, ctx }) => {
      const azureAIFoundryClient = new OpenAI({
        baseURL: ctx.configuration.baseUrl,
        apiKey: ctx.configuration.apiKey,
      })
      const output = await llm.openai.generateContent<ModelId>(
        <llm.GenerateContentInput>input,
        azureAIFoundryClient as any,
        logger,
        {
          provider,
          models: LanguageModels,
          defaultModel: DEFAULT_MODEL_ID,
        }
      )
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
