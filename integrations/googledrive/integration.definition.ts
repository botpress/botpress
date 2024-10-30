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
    listFiles: { // TODO: Implement listable
      title: 'List Files',
      description: 'List files in a Google Drive',
      input: {
        schema: z.object({
          nextToken: z.string().optional().describe('The token to use to get the next page of results'),
        }),
      },
      output: {
        schema: z.object({
          items: z.array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
            })
          ).describe('The list of files in the Google Drive. Results may be paginated, if set, use nextToken to get additional results'),
          meta: z.object({
            nextToken: z.string().optional().describe('The token to use to get the next page of results'),
          }),
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
    },
    list: {
      type: 'integration',
      schema: z.object({
        knownFilesMapJson: z
          .string()
          .title('Serialized map of known files')
          .describe('Serialized map of known files (keys are file IDs and values are GoogleDriveFile objects)')
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
