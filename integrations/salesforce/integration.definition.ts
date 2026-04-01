import { IntegrationDefinition, z } from '@botpress/sdk'
import { actionDefinitions } from './definitions'

export default new IntegrationDefinition({
  name: 'salesforce',
  title: 'Salesforce',
  version: '1.5.0',
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
    sandbox: {
      title: 'Sandbox',
      description: 'Use Salesforce sandbox environment (test.salesforce.com)',
      schema: z.object({}),
    },
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        isSandbox: z.boolean(),
        accessToken: z.string(),
        instanceUrl: z.string(),
        refreshToken: z.string().optional(),
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
