import { IntegrationDefinition, messages } from '@botpress/sdk'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'outlook',
  version: '0.2.0',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      tenantId: z.string({
        description: 'Azure AD tenant id',
      }),
      clientId: z.string({
        description: 'Azure AD app client id',
      }),
      clientSecret: z.string({
        description: 'Azure AD app client secret',
      }),
      emailAddress: z.string({
        description: 'Email address to listen',
      }),
      mailFolder: z
        .string({
          description: 'Email folder to process messages (default: "inbox")',
        })
        .default('inbox'),
      emailSignature: z.string({
        description: 'Signature to include in all emails',
      }),
    }),
  },
  channels: {
    channel: {
      messages: {
        ...messages.defaults,
        html: {
          schema: z.object({
            content: z.string(),
          }),
        },
      },
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: {
          id: {},
          subject: {},
          from: {},
          toRecipients: {},
          ccRecipients: {},
          refMessageId: {},
        },
      },
    },
  },
  user: {
    tags: {
      id: {},
    },
  },
  actions: {},
  events: {},
  states: {
    subscriptionInfo: {
      type: 'integration',
      schema: z.object({
        subscriptionId: z.string(),
      }),
    },
  },
})
