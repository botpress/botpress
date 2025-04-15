import { IntegrationDefinition } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { INTEGRATION_NAME } from './src/const'
import { events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Freshchat (Beta)',
  version: '1.0.0',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Freshchat as a HITL Provider',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  events,
  user,
}).extend(hitl, () => ({
  entities: {},
  channels: {
    hitl: {
      title: 'Freshchat',
      description: 'Freshchat HITL',
      conversation: {
        tags: {
          id: { title: 'Freshchat Conversation Id', description: 'Freshchat Conversation Id' },
        },
      },
      message: {
        tags: {
          id: {
            title: 'Freshchat Message ID',
            description: 'The ID of the message in Freshchat',
          },
        },
      },
    },
  },
}))
