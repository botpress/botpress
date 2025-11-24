import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'
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
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
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
    messagingUser: {
      title: 'Messaging User',
      description: 'A Zendesk Messaging (Sunshine Conversations) user',
      schema: sdk.z
        .object({
          id: sdk.z.string().title('ID').describe('The Sunshine Conversations user ID'),
        })
        .title('User')
        .describe('The user object fields'),
    },
    messagingConversation: {
      title: 'Messaging Conversation',
      description: 'A Zendesk Messaging (Sunshine Conversations) conversation',
      schema: sdk.z
        .object({
          id: sdk.z.string().title('ID').describe('The Sunshine Conversations conversation ID'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
    },
  },
})
  .extend(typingIndicator, () => ({ entities: {} }))
  .extend(proactiveUser, ({ entities }) => ({
    entities: {
      user: entities.messagingUser,
    },
    actions: {
      getOrCreateUser: {
        name: 'getOrCreateMessagingUser',
        title: 'Get or create messaging user',
        description: 'Get or create a user in Zendesk Messaging (Sunshine Conversations)',
      },
    },
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.messagingConversation,
    },
    actions: {
      getOrCreateConversation: {
        name: 'getOrCreateMessagingConversation',
        title: 'Get or create messaging conversation',
        description: 'Get or create a conversation in Zendesk Messaging (Sunshine Conversations)',
      },
    },
  }))
  .extend(hitl, (self) => ({
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
