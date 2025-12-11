import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import hitl from './bp_modules/hitl'

export default new sdk.IntegrationDefinition({
  name: 'zendesk-messaging-hitl',
  version: '0.1.1',
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
    switchboardIntegrationIds: {
      type: 'integration',
      schema: sdk.z.object({
        switchboardIntegrationId: sdk.z
          .string()
          .title('Switchboard Integration ID')
          .describe('The ID of the Botpress switchboard integration used for HITL sessions')
          .optional(),
        agentWorkspaceSwitchboardIntegrationId: sdk.z
          .string()
          .title('Agent Workspace Switchboard Integration ID')
          .describe('The ID of the Zendesk Agent Workspace switchboard integration')
          .optional(),
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
          .enum(['Low', 'Normal', 'High', 'Urgent'])
          .title('Priority')
          .describe('Priority of the conversation. Leave empty for default priority.')
          .optional(),
        originSourceType: sdk.z
          .enum([
            'android',
            'ios',
            'web',
            'sdk',
            'apple',
            'googlercs',
            'instagram',
            'kakao',
            'line',
            'mailgun',
            'messagebird',
            'messenger',
            'slackconnect',
            'telegram',
            'twilio',
            'twitter',
            'viber',
            'wechat',
            'whatsapp',
          ])
          .title('Origin Source Type')
          .describe(
            'The channel where this conversation originated from. Leave empty to default to SUNSHINE CONVERSATIONS API.'
          )
          .optional(),
        organizationId: sdk.z
          .string()
          .title('Organization Id')
          .describe('The organization ID to assign the ticket to.')
          .optional(),
        brandId: sdk.z.string().title('Brand Id').describe('The brand ID to assign the ticket to.').optional(),
        groupId: sdk.z.string().title('Group Id').describe('The group ID to assign the ticket to.').optional(),
        assigneeId: sdk.z.string().title('Assignee Id').describe('The assignee ID to assign the ticket to.').optional(),
        tags: sdk.z.array(sdk.z.string()).title('Tags').describe('Tags to add to the ticket.').optional(),
        customTicketFields: sdk.z
          .array(
            sdk.z.object({
              id: sdk.z.string().min(1).title('Custom Field ID').describe('The ID of the custom field in Zendesk'),
              value: sdk.z
                .string()
                .min(1)
                .title('Custom Field Value')
                .describe('The value to set for this custom field'),
            })
          )
          .title('Custom Ticket Fields')
          .describe(
            'Custom ticket fields to set on the ticket. The id should be the ticket field ID, and the value should be the field value. Example: { "40033266756891": "value" }'
          )
          .optional(),
        additionalMetadata: sdk.z
          .array(
            sdk.z.object({
              key: sdk.z.string().min(1).title('Metadata Key').describe('The metadata key to add'),
              value: sdk.z.string().min(1).title('Metadata Value').describe('The value to set for this metadata key'),
            })
          )
          .title('Additional Metadata')
          .describe('Additional metadata fields to add directly to the metadata object.')
          .optional(),
      }),
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
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
