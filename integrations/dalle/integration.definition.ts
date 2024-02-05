import { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'

const sizeSchema = z
  .union([z.literal('1024x1024'), z.literal('1792x1024'), z.literal('1024x1792')])
  .describe('Size of the image to generate.')

const qualitySchema = z.union([z.literal('standard'), z.literal('hd')]).describe('Quality of the image to generate.')

const modelSchema = z.union([z.literal('dall-e-3')]).describe('Model to use.')

export default new IntegrationDefinition({
  name: 'dalle',
  version: '0.2.0',
  icon: 'icon.svg',
  title: 'Dalle Image Generation',
  description: 'Generate images using Dalle',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('Open API Key'),
    }),
  },
  channels: {},
  actions: {
    generateImage: {
      input: {
        schema: z.object({
          prompt: z.string().describe('Prompt for image generation.'),
          size: sizeSchema.optional(),
          quality: qualitySchema.optional(),
          model: modelSchema.optional(),
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
