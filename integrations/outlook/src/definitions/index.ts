import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    tenantId: z.string().describe('Azure AD tenant id'),
    clientId: z.string().describe('Azure AD app client id'),
    clientSecret: z.string().describe('Azure AD app client secret'),
    emailAddress: z.string().describe('Email address to listen'),
    mailFolder: z
      .string()
      .default('inbox')
      .describe('Email folder to process messages (default: "inbox")'),
    emailSignature: z.string().describe('Signature to include in all emails'),
    useAsChannel: z.boolean().describe('Use integration as a channel'),
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
