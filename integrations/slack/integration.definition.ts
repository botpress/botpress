import { IntegrationDefinition } from '@botpress/sdk'
import typingIndicator from 'bp_modules/typing-indicator'
import proactiveConversation from 'bp_modules/proactive-conversation'

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
  entities,
} from './definitions'

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '4.0.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  configurations,
  identifier,
  states,
  channels,
  actions,
  entities,
  events,
  secrets,
  user,
})
  .extend(typingIndicator, () => ({
    entities: {},
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.conversation,
    },
  }))
