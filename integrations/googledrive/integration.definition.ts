import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      privateKey: z
        .string()
        .min(1)
        .describe('The private key from the Google service account. You can get it from the downloaded JSON file.'),
      clientEmail: z
        .string()
        .min(1)
        .describe('The client email from the Google service account. You can get it from the downloaded JSON file.'),
      driveId: z.string().min(1).describe('The ID of the Google Drive to be accessed by the bot.'),
    }),
  },
  actions: {
    listFiles: {
      title: 'List Files',
      description: 'List files in a Google Drive',
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({
          files: z.array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
            })
          ),
        }),
      },
    },
  },
})
