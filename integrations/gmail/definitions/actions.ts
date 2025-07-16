import * as sdk from '@botpress/sdk'
import { checkInbox } from 'src/actions/check-inbox'

export const actions = {
  getMyEmail: {
    title: 'Get my Email',
    description: "Get the user's email address",
    input: {
      schema: sdk.z.object({}),
    },
    output: {
      schema: sdk.z.object({
        emailAddress: sdk.z.string().title('Email Address').describe('The email address of the user'),
      }),
    },
  },
<<<<<<< HEAD
  sendEmail: {
    title: 'Send Email',
    description: 'Send an email to a specified email address',
    input: {
      schema: sdk.z.object({
        recipient: sdk.z.string().title('Recipient Email Address').describe('the email address of the recipient'),
        subject: sdk.z.string().title('Subject').describe('The subject of the outgoing email'),
        body: sdk.z.string().title('Message body').describe('The body of the outgoing email'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
  checkInbox: {
    title: 'Check Inbox',
    description: 'List emails from the inbox with optional filtering',
    input: {
      schema: sdk.z.object({
        query: sdk.z
          .string()
          .optional()
          .title('Search Query')
          .describe('Gmail search query to filter emails (e.g., "is:unread", "from:example@gmail.com")'),
        maxResults: sdk.z
          .number()
          .optional()
          .title('Max Results')
          .describe('Maximum number of messages to return (default: 100)'),
        pageToken: sdk.z
          .string()
          .optional()
          .title('Page Token')
          .describe(
            'Token used toPage token to retrieve a specific page of results in the list. Only used when retrieving a past the first page.'
          ),
      }),
    },
    output: {
      schema: sdk.z.object({
        hasEmails: sdk.z.boolean().title('Has New Emails').describe('Whether there are emails matching the criteria'),
        messages: sdk.z
          .array(
            sdk.z.object({
              id: sdk.z.string().title('Message ID').describe('The ID of the message'),
              threadId: sdk.z.string().title('Thread ID').describe('The ID of the thread'),
            })
          )
          .title('Messages')
          .describe('List of messages matching the criteria'),
        nextPageToken: sdk.z
          .string()
          .nullable()
          .title('Next Page Token')
          .describe('Token for retrieving the next page of results'),
        resultSizeEstimate: sdk.z.number().title('Result Size Estimate').describe('Estimated total number of results'),
      }),
    },
  },
  getEmail: {
    title: 'Get Email',
    description: 'Retrieve the full content of a specific email by its ID',
    input: {
      schema: sdk.z.object({
        messageId: sdk.z.string().title('Message ID').describe('The ID of the email message to retrieve'),
      }),
    },
    output: {
      schema: sdk.z.object({
        id: sdk.z.string().title('Message ID').describe('The ID of the message'),
        threadId: sdk.z.string().title('Thread ID').describe('The ID of the thread'),
        subject: sdk.z.string().title('Subject').describe('The subject of the email'),
        from: sdk.z.string().title('From').describe('The sender of the email'),
        to: sdk.z.string().title('To').describe('The recipient(s) of the email'),
        cc: sdk.z.string().title('CC').describe('The CC recipient(s) of the email'),
        bcc: sdk.z.string().title('BCC').describe('The BCC recipient(s) of the email'),
        date: sdk.z.string().title('Date').describe('The date the email was sent'),
        snippet: sdk.z.string().title('Snippet').describe('A short snippet of the email content'),
        bodyText: sdk.z.string().title('Body Text').describe('The plain text body of the email'),
        bodyHtml: sdk.z.string().title('Body HTML').describe('The HTML body of the email'),
        labelIds: sdk.z.array(sdk.z.string()).title('Label IDs').describe('The labels applied to this email'),
        sizeEstimate: sdk.z.number().title('Size Estimate').describe('Estimated size of the email in bytes'),
        isUnread: sdk.z.boolean().title('Is Unread').describe('Whether the email is unread'),
      }),
    },
  },
=======
>>>>>>> 664ccdf2 (have getmyemail action)
} as const satisfies sdk.IntegrationDefinitionProps['actions']
