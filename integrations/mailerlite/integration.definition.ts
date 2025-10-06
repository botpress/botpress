import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, events, states } from 'definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'MailerLite',
  description: 'Connect with MailerLite to manage subscribers, groups, and email campaigns',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z
      .object({
        APIKey: z.string().title('API Key').describe('Developer API token').min(1).secret(),
      })
      .required(),
  },

  actions,
  events,
  states,
})
