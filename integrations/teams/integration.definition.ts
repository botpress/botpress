import { IntegrationDefinition, z } from '@botpress/sdk'
import typingIndicator from 'bp_modules/typing-indicator'
import { actions, channels, user, states } from 'definitions'

export default new IntegrationDefinition({
  name: 'teams',
  version: '2.2.0',
  title: 'Microsoft Teams',
  description: 'Interact with users, deliver notifications, and perform actions within Microsoft Teams.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({}),
  },
  channels,
  user,
  actions,
  events: {},
  states,

  attributes: {
    category: 'Communication & Channels',
    guideSlug: 'teams',
    repo: 'botpress',
  },
}).extend(typingIndicator, () => ({ entities: {} }))
