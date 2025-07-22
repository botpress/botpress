import { z, IntegrationDefinition, messages } from '@botpress/sdk'

const EmailHeaders = z.object({
  id: z.string(),
  subject: z.string(),
  inReplyTo: z.string().optional(),
  date: z.string().optional().describe('ISO datetime'),
  sender: z.string(),
  firstMessageId: z.string().optional(),
})

export default new IntegrationDefinition({
  name: 'email',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z
      .object({
        user: z
          .string()
          .describe('The email account you want to use to receive and send messages. Example: example@gmail.com'),
        password: z.string().describe('The password to the email account.'),
        imapHost: z.string().describe('The imap server you want to connect to. Example: imap.gmail.com'),
        smtpHost: z.string().describe('The smtp server you want to connect to. Example: smtp.gmail.com'),
      })
      .required(),
  },
  states: {
    lastSyncTimestamp: {
      type: 'integration',
      schema: z.object({
        lastSyncTimestamp: z.string().datetime(),
      }),
    },
    syncLock: {
      type: 'integration',
      schema: z.object({ currentlySyncing: z.boolean().default(false) }),
    },
  },
  actions: {
    listEmails: {
      title: 'List emails',
      description: 'List all emails in the inbox',
      input: {
        schema: z.object({
          nextToken: z.string().optional().describe('The page number in the inbox. Starts at 0').optional(),
        }),
      },
      output: {
        schema: z.object({
          messages: z.array(EmailHeaders),
          nextToken: z.string(),
        }),
      },
    },
    getEmail: {
      title: 'Get emails',
      description: 'Get the email with specified id from the inbox',
      input: {
        schema: z.object({
          id: z.string(),
        }),
      },
      output: {
        schema: EmailHeaders.extend({
          body: z.string().optional(),
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
    sendEmail: {
      title: 'Send Email',
      description: 'Send an email using SMTP',
      input: {
        schema: z.object({
          to: z.string().describe('The email address of the recipient'),
          subject: z.string().optional().describe('The subject of the outgoing email'),
          text: z.string().optional().describe('The text contained in the body of the email'),
          inReplyTo: z.string().optional().describe('The id of the email you want to reply to'),
          replyTo: z
            .string()
            .optional()
            .describe(
              'The email address to which replies should be sent. This allows recipients to reply to a different address than the sender'
            ),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  channels: {
    default: {
      message: { tags: { id: { title: 'Email id', description: 'The email id ' } } },
      messages: { text: messages.defaults.text },
      conversation: {
        tags: {
          firstMessageId: {
            title: 'First Message Id',
            description: 'The id (from the IMAP server) of the first incoming message of the conversation',
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
