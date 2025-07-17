import { z, IntegrationDefinition, messages } from '@botpress/sdk'

export type EmailMessage = z.infer<typeof emailMessageSchema>
const emailMessageSchema = z.object({
  id: z.string(),
  subject: z.string(),
  body: z.string(),
  inReplyTo: z.string().optional(),
  date: z.date().optional(),
  sender: z.string(),
  firstMessageId: z.string().optional(),
})

export default new IntegrationDefinition({
  name: 'email',
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
          messages: z.array(emailMessageSchema),
        }),
      },
    },
    syncEmails: {
      title: 'Sync Emails',
      description: 'Sends unseen emails as new messages. Call periodically to allow your bot to receive new emails.',
      input: { schema: z.object({}) },
      output: {
        schema: z.object({}),
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
          inReplyTo: z.string().optional(),
          replyTo: z.string().optional(),
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
      message: { tags: { id: { title: 'Foreign id', description: 'The foreign email id ' } } },
      messages: { text: messages.defaults.text },
      conversation: {
        tags: {
          firstMessageId: {
            title: 'First Message Id',
            description: 'The foreign id (from the IMAP server) of the first incoming message of the conversation',
          },
          subject: { title: 'Thread Subject', description: 'Subject for the conversation' },
          to: { title: 'Recipient', description: 'Recipient email address for the conversation' },
          latestEmail: {
            title: 'Email id',
            description: 'The id of the latest email received (to put in the In-Reply-To header)',
          },
        },
      },
    },
  },
  user: {
    tags: {
      email: { title: 'User email', description: 'Required' },
    },
  },
})
