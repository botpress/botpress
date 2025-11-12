/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'

const sizeDescription =
  'Size of the image to generate. Can be "1024x1024", "1792x1024", or "1024x1792". Defaults to 1024x1024.'
const qualityDescription = 'Quality of the image to generate. Can be "standard" or "hd". Defaults to "standard".'
const modelDescription = 'Model to use for image generation. Defaults to "dall-e-3".'

export default new IntegrationDefinition({
  name: 'dalle',
  version: '0.3.4',
  icon: 'icon.svg',
  title: 'DALL-E (Deprecated)',
  description: 'Integrate DALL-E to generate images directly within your chatbot conversations.',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('Open AI Key'),
    }),
  },
  channels: {},
  actions: {
    generateImage: {
      input: {
        schema: z.object({
          prompt: z.string().describe('Prompt for image generation.'),
          size: z.string().optional().describe(sizeDescription),
          quality: z.string().optional().describe(qualityDescription),
          model: z.string().optional().describe(modelDescription),
          user: z.string().optional().describe('User ID'),
        }),
      },
      output: {
        schema: z.object({
          url: z.string().url(),
          createdDate: z.string(),
        }),
      },
    },
  },
})
