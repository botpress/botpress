import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Odoo',
  description: 'Connect Botpress to Odoo records such as leads, contacts, and tickets.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
