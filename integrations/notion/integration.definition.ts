import * as sdk from '@botpress/sdk'
import { actions, configuration, configurations, identifier, secrets, states, user } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'notion',
  description: 'Add pages and comments, manage databases, and engage in discussions — all within your chatbot.',
  title: 'Notion',
  version: '1.0.1',
  icon: 'icon.svg',
  readme: 'hub.md',
  actions,
  configuration,
  configurations,
  identifier,
  secrets,
  states,
  user,
})
