import { IntegrationDefinition, interfaces, z } from '@botpress/sdk'
import { languageModelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'openai',
  title: 'OpenAI',
  version: '7.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
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
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
})
  .extend(interfaces.llm, ({ modelRef }) => ({ modelRef }))
  .extend(interfaces.textToImage, ({ imageModelRef, imageGenerationParams }) => ({
    imageModelRef,
    imageGenerationParams,
  }))
  .extend(interfaces.speechToText, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
