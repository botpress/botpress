import * as sdk from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { INTEGRATION_NAME } from './src/const'
import { events, configuration, channels, states, user } from './src/definitions'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Freshchat',
  version: '1.4.0',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Freshchat as a HITL Provider',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  events,
  user,
  entities: {
    hitlConversation: {
      title: 'HITL Conversation',
      description: 'A support request',
      schema: sdk.z.object({
        priority: sdk.z
          .enum(['Low', 'Medium', 'High', 'Urgent'])
          .title('Conversation Priority')
          .describe('Priority of the conversation. Leave empty for default priority.')
          .optional(),
      }),
    },
  },
}).extend(hitl, (self) => ({
  entities: { hitlSession: self.entities.hitlConversation },
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
