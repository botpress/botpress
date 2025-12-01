import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import hitl from './bp_modules/hitl'

export default new sdk.IntegrationDefinition({
  name: 'zendesk-messaging-hitl',
  version: '1.0.0',
  title: 'Zendesk Messaging HITL',
  description: 'This integration allows your bot to use Sunshine Conversations (Sunco) as a HITL Provider for Zendesk',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({
      appId: sdk.z.string().min(1).title('App ID').describe('Your Sunshine Conversations App ID'),
      keyId: sdk.z.string().min(1).title('Key ID').describe('Your Sunshine Conversations Key ID'),
      keySecret: sdk.z.string().min(1).title('Key Secret').describe('Your Sunshine Conversations Key Secret'),
    }),
  },
  states: {
    integrationIds: {
      type: 'integration',
      schema: sdk.z.object({
        switchboardIntegrationId: sdk.z.string().optional(),
        agentWorkspaceSwitchboardIntegrationId: sdk.z.string().optional(),
      }),
    },
  },
  channels: {},
  events: {},
  user: {
    tags: {
      id: {
        title: 'User ID',
        description: 'The Sunshine Conversations user ID',
      },
      email: {
        title: 'Email',
        description: 'The email address of the Sunshine Conversations user',
      },
    },
  },
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
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  __advanced: {
    useLegacyZuiTransformer: true,
  },
}).extend(hitl, (self) => ({
  entities: { hitlSession: self.entities.hitlConversation },
  channels: {
    hitl: {
      title: 'Zendesk Messaging',
      description: 'Zendesk Messaging HITL',
      conversation: {
        tags: {
          id: { title: 'Sunco Conversation Id', description: 'Sunco Conversation Id' },
        },
      },
      message: {
        tags: {
          id: {
            title: 'Sunco Message ID',
            description: 'The ID of the message in Sunco',
          },
        },
      },
    },
  },
}))
