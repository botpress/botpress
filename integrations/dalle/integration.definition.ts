import { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'

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
