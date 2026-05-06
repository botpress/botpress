import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, states } from './definitions'

export default new IntegrationDefinition({
  name: 'odoo',
  title: 'Odoo',
  description: 'Connect Botpress to Odoo records such as leads, contacts, and tickets.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  actions,
})
