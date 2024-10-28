import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl'
    },
    schema: z.object({
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
  states:{
    configuration: {
      type: 'integration',
      schema: z.object({
        refreshToken: z
          .string()
          .title('Refresh token')
          .describe('The refresh token to use to authenticate with Google. It gets exchanged for a bearer token')
      })
    }
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID in your Google Cloud Credentials',
    },
    CLIENT_SECRET: {
      description: 'The client secret associated with your client ID',
    }
  },
})
