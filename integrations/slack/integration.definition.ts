import { IntegrationDefinition } from '@botpress/sdk'
import typingIndicator from 'bp_modules/typing-indicator'

import {
  actions,
  channels,
  configuration,
  configurations,
  events,
  identifier,
  secrets,
  states,
  user,
} from './definitions'

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '1.1.3',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  configurations,
  identifier,
  states,
  channels,
  actions,
  events,
  secrets,
  user,
}).extend(typingIndicator, () => ({
  entities: {},
}))
