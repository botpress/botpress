import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import hitl from './bp_modules/hitl'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new sdk.IntegrationDefinition({
  name: 'zendesk',
  title: 'Zendesk',
  version: '3.0.0',
  icon: 'icon.svg',
  description:
    'Optimize your support workflow. Trigger workflows from ticket updates as well as manage tickets, access conversations, and engage with customers.',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  user,
  actions,
  events,
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: {
      description: 'The client ID of your app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your app',
    },
    CODE_CHALLENGE: {
      description: 'The code challenge for PKCE',
    },
  },
  entities: {
    hitlTicket: {
      schema: sdk.z.object({
        priority: sdk.z
          .enum(['low', 'normal', 'high', 'urgent'])
          .title('Ticket Priority')
          .describe('Priority of the ticket. Leave empty for default priority.')
          .optional(),
        chatbotName: sdk.z
          .string()
          .title('Chatbot Name')
          .describe('Name of the chatbot that will be used in the Zendesk ticket. Defaults to "Botpress".')
          .optional(),
        chatbotPhotoUrl: sdk.z
          .string()
          .title('Chatbot Photo URL')
          .describe(
            'Photo URL of the chatbot that will be used in the Zendesk ticket. Must be a publicly-accessible PNG image. Defaults to Botpress logo.'
          )
          .optional(),
      }),
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.hitlTicket,
  },
  channels: {
    hitl: {
      title: 'Zendesk Ticket',
      description: 'Human in the loop channel for managing Zendesk tickets',
      conversation: {
        tags: {
          id: {
            title: 'Zendesk Ticket ID',
            description: 'The unique identifier of the Zendesk ticket associated with this conversation',
          },
        },
      },
      message: {
        tags: {
          zendeskCommentId: {
            title: 'Zendesk Comment ID',
            description: 'The ID of the comment in Zendesk',
          },
        },
      },
    },
  },
}))
