import sdk, { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { integrationName } from './package.json'

export interface EmailMessage {
  id: string
  subject: string
  body: string
  inReplyTo?: string
  date?: Date
  sender: string
}

const EmailMessageObject = z.object({
  id: z.string(),
  subject: z.string(),
  body: z.string(),
  inReplyTo: z.string().optional(),
  date: z.date().optional(),
  sender: z.string(),
})

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: { schema: z.object({ user: z.string(), password: z.string() }).required() },
  states: {
    seenMails: {
      type: 'integration',
      schema: z.object({ seenMails: z.array(z.object({ id: z.string() })) }),
    },
  },
  actions: {
    listEmails: {
      title: 'List emails',
      description: 'List all emails in the inbox',
      input: { schema: z.object({}) },
      output: {
        schema: z.object({
          messages: z.array(EmailMessageObject),
        }),
      },
    },
    syncEmails: {
      title: 'Sync Emails',
      description:
        'Reads all emails in the inbox. Call periodically to refresh the inbox (the integration will only add new emails)',
      input: { schema: z.object({}) },
      output: {
        schema: z.object({
          messages: z.array(EmailMessageObject),
        }),
      },
    },
    sendMail: {
      title: 'Send Mail',
      description: 'Send an email using SMTP',
      input: {
        schema: z.object({
          to: z.string(),
          subject: z.string().optional(),
          text: z.string().optional(),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().optional(),
        }),
      },
    },
  },
  channels: {
    default: {
      messages: { text: messages.defaults.text },
      conversation: { tags: {} },
    },
  },
  user: {
    tags: {
      email: { title: 'User email', description: 'Required' },
    },
  },
})
