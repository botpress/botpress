import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('Loops API Key'),
    }),
  },
  actions: {
    sendTransactionalEmail: {
      title: 'Send Transactional Email',
      description: 'Send a transactional email to a client',
      input: {
        schema: z.object({
          email: z.string().describe('Email address'),
          transactionalId: z.string().describe('Transactional ID'),
          dataVariables: z.record(z.string(), z.string()).describe('Data variables'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().describe('Success'),
        }),
      },
    },
  }
})