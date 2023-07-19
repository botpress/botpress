import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { channels } from './channels'

export const configuration = {
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
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  subscriptionInfo: {
    type: 'integration',
    schema: z.object({
      subscriptionId: z.string(),
    }),
  },
  lastMessageRef: {
    type: 'conversation',
    schema: z.object({
      lastMessageId: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: {},
  },
} satisfies IntegrationDefinitionProps['user']
