import { IntegrationDefinition, z } from '@botpress/sdk'
import { actionDefinitions } from './definitions'

export default new IntegrationDefinition({
  name: 'salesforce',
  title: 'Salesforce',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Salesforce integration allows you to create, search, update and delete a variety of Salesforce objects',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({}),
  },
  configurations: {
    sfsandbox: {
      title: 'Sandbox',
      description: 'Use Salesforce sandbox environment (test.salesforce.com)',
      schema: z.object({}),
      identifier: {
        linkTemplateScript: 'linkTemplate.vrl',
      },
    },
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        isSandbox: z.boolean().title('Is Sandbox').describe('Whether this is a Salesforce sandbox environment'),
        accessToken: z.string().title('Access Token').describe('OAuth access token for Salesforce API calls'),
        instanceUrl: z
          .string()
          .title('Instance URL')
          .describe('Salesforce instance URL (e.g. https://yourorg.salesforce.com)'),
        refreshToken: z
          .string()
          .optional()
          .title('Refresh Token')
          .describe('OAuth refresh token used to obtain new access tokens'),
      }),
    },
  },
  secrets: {
    CONSUMER_KEY: {
      description: 'Consumer key of the Salesforce app',
    },
    CONSUMER_SECRET: {
      description: 'Consumer secret of the Salesforce app',
    },
  },
  actions: actionDefinitions,
})
