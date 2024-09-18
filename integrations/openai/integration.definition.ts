import { IntegrationDefinition, interfaces, z } from '@botpress/sdk'
import { languageModelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'openai',
  version: '6.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      url: z.string().describe('Base URL for the Azure OpenAI API'),
      apiKey: z.string().describe('Azure OpenAI API key'),
      apiVersion: z.string().describe('Azure API version'),
    }),
  },
  entities: {
    modelRef: {
      schema: z.object({
        id: languageModelId,
      }),
    },
    imageModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
    speechToTextModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
    imageGenerationParams: {
      schema: z.object({
        style: z
          .enum(['natural', 'vivid'])
          .default('vivid')
          .describe('Image style - Only supported by DALL-E 3 models'),
        user: z.string().optional().describe('User ID to associate with the image, for abuse detection purposes'),
      }),
    },
  },
})
  .extend(interfaces.llm, ({ modelRef }) => ({ modelRef }))
  .extend(interfaces.textToImage, ({ imageModelRef, imageGenerationParams }) => ({
    imageModelRef,
    imageGenerationParams,
  }))
  .extend(interfaces.speechToText, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
