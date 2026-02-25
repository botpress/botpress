import { z, IntegrationDefinition, messages } from '@botpress/sdk'

const emailSchema = z.object({
  id: z.string().describe('The unique identifier of the email'),
  subject: z.string().describe('The subject line of the email'),
  inReplyTo: z.string().optional().describe('The ID of the email this is replying to'),
  date: z.string().optional().describe('ISO datetime'),
  sender: z.string().describe('The email address of the sender'),
  firstMessageId: z.string().optional().describe('The ID of the first message in the conversation thread'),
})

export default new IntegrationDefinition({
  name: 'email',
  version: '0.1.3',
  title: 'Email',
  description: 'Send and receive emails using IMAP and SMTP protocols',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z
      .object({
        user: z
          .string()
          .title('Email Address')
          .describe('The email account you want to use to receive and send messages. Example: example@gmail.com'),
        password: z.string().title('Account Password').describe('The password to the email account.'),
        imapHost: z
          .string()
          .title('IMAP Host')
          .describe('The imap server you want to connect to. Example: imap.gmail.com'),
        smtpHost: z
          .string()
          .title('SMTP Host')
          .describe('The smtp server you want to connect to. Example: smtp.gmail.com'),
      })
      .required(),
  },
  states: {
    lastSyncTimestamp: {
      type: 'integration',
      schema: z.object({
        lastSyncTimestamp: z
          .string()
          .datetime()
          .title('Last Sync Timestamp')
          .describe('The timestamp of the last successful email synchronization'),
      }),
    },
    syncLock: {
      type: 'integration',
      schema: z.object({
        currentlySyncing: z
          .boolean()
          .default(false)
          .title('Currently Syncing')
          .describe('Indicates whether an email synchronization is currently in progress'),
      }),
    },
  },
  actions: {
    listEmails: {
      title: 'List emails',
      description: 'List all emails in the inbox',
      input: {
        schema: z.object({
          nextToken: z
            .string()
            .optional()
            .title('Next Token')
            .describe('The page number in the inbox. Starts at 0')
            .optional(),
        }),
      },
      output: {
        schema: z.object({
          messages: z.array(emailSchema).describe('The list of email messages'),
          nextToken: z.string().optional().describe('Token for retrieving the next page of results'),
        }),
      },
    },
    getEmail: {
      title: 'Get emails',
      description: 'Get the email with specified id from the inbox',
      input: {
        schema: z.object({
          id: z.string().title('Email ID').describe('The unique identifier of the email to retrieve'),
        }),
      },
      output: {
        schema: emailSchema.extend({
          body: z.string().optional().describe('The body content of the email'),
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
          to: z.string().title('To').describe('The email address of the recipient'),
          subject: z.string().optional().title('Subject').describe('The subject of the outgoing email'),
          text: z.string().optional().title('Text').describe('The text contained in the body of the email'),
          inReplyTo: z.string().optional().title('In Reply To').describe('The id of the email you want to reply to'),
          replyTo: z
            .string()
            .optional()
            .title('Reply To')
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
      title: 'Email',
      description: 'Email channel for sending and receiving emails',
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
  attributes: {
    category: "Marketing & Email"
  }
})
