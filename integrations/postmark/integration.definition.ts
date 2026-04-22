import * as sdk from '@botpress/sdk'
import proactiveConversation from 'bp_modules/proactive-conversation'

const emailProps = {
  cc: sdk.z
    .array(sdk.z.object({ email: sdk.z.string().email(), name: sdk.z.string().optional() }))
    .optional()
    .describe('The CC recipients of the initial email')
    .title('CC Recipients'),
  bcc: sdk.z
    .array(sdk.z.object({ email: sdk.z.string().email(), name: sdk.z.string().optional() }))
    .optional()
    .describe('The BCC recipients of the initial email')
    .title('BCC Recipients'),
  subject: sdk.z.string().optional().describe('The subject of the email').title('Email Subject'),
}

export default new sdk.IntegrationDefinition({
  name: 'postmark',
  title: 'Postmark',
  description: 'Send and receive emails through Postmark',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: sdk.z.object({
      serverToken: sdk.z.string().secret().min(1).title('Server Token').describe('Your Postmark Server API Token'),
      fromEmail: sdk.z.string().email().min(1).title('From Email').describe('Default sender email address'),
      webhookSecret: sdk.z
        .string()
        .secret()
        .optional()
        .title('Webhook Secret')
        .describe(
          'Optional secret to verify inbound webhooks. Append ?secret=YOUR_SECRET to your Postmark webhook URL.'
        ),
    }),
  },
  user: {
    tags: {
      emailAddress: {
        title: 'Email Address',
        description: 'Email address of the user',
      },
    },
  },
  channels: {
    mail: {
      title: 'Mail',
      description: 'Send and receive emails through Postmark',
      conversation: {
        tags: {
          threadRootMessageId: {
            title: 'Thread Root Message ID',
            description: 'The Message-ID of the first email in the thread, used to group replies into one conversation',
          },
          postmarkEmailAddress: {
            title: 'Postmark Email Address',
            description: 'The email address used in Postmark',
          },
          userEmailAddress: {
            title: 'User Email Address',
            description: 'The email address of the user',
          },
        },
      },
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'The ID of the email message',
          },
          emailMessageId: {
            title: 'Email Message-ID',
            description:
              'RFC 5322 Message-ID of the email. Absent on attachment sub-messages so they are excluded from thread reconstruction.',
          },
          subject: {
            title: 'Subject',
            description: 'The subject of the email',
          },
          cc: {
            title: 'CC',
            description: 'The CC recipients of the email',
          },
          bcc: {
            title: 'BCC',
            description: 'The BCC recipients of the email',
          },
          spamScore: {
            title: 'Spam Score',
            description: 'The spam score of the email as calculated by Postmark',
          },
        },
      },
      messages: {
        text: { schema: sdk.messages.defaults.text.schema.extend(emailProps) },
        image: { schema: sdk.messages.defaults.image.schema.extend(emailProps) },
        audio: { schema: sdk.messages.defaults.audio.schema.extend(emailProps) },
        video: { schema: sdk.messages.defaults.video.schema.extend(emailProps) },
        file: { schema: sdk.messages.defaults.file.schema.extend(emailProps) },
        location: { schema: sdk.messages.defaults.location.schema.extend(emailProps) },
        carousel: { schema: sdk.messages.defaults.carousel.schema.extend(emailProps) },
        card: { schema: sdk.messages.defaults.card.schema.extend(emailProps) },
        dropdown: { schema: sdk.messages.defaults.dropdown.schema.extend(emailProps) },
        choice: { schema: sdk.messages.defaults.choice.schema.extend(emailProps) },
        bloc: { schema: sdk.messages.defaults.bloc.schema.extend(emailProps) },
      },
    },
  },
  entities: {
    conversation: {
      title: 'Conversation',
      description: 'A postmark replyThread',
      schema: sdk.z
        .object({
          conversationInformation: sdk.z
            .object({
              rootEmailId: sdk.z
                .string()
                .optional()
                .describe('The ID of the root email in the thread')
                .title('Root Email ID'),
              lastEmailId: sdk.z
                .string()
                .optional()
                .describe('The ID of the last email in the thread')
                .title('Last Email ID'),
            })
            .optional(),
          userEmailAddress: sdk.z.string().describe('The recipient email address').title('Recipient Email Address'),
          userName: sdk.z.string().optional().describe('The recipient name').title('Recipient Name'),
          cc: sdk.z
            .array(sdk.z.object({ email: sdk.z.string().email(), name: sdk.z.string().optional() }))
            .optional()
            .describe('The CC recipients of the initial email')
            .title('CC Recipients'),
          bcc: sdk.z
            .array(sdk.z.object({ email: sdk.z.string().email(), name: sdk.z.string().optional() }))
            .optional()
            .describe('The BCC recipients of the initial email')
            .title('BCC Recipients'),
          subject: sdk.z
            .string()
            .optional()
            .describe('The subject of the initial email')
            .title('Initial Email Subject'),
          text: sdk.z
            .string()
            .min(1)
            .describe('The body of the initial email that opens the thread')
            .title('Initial Email Body'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
    },
  },
}).extend(proactiveConversation, ({ entities }) => ({
  entities: { conversation: entities.conversation },
  actions: {
    getOrCreateConversation: {
      name: 'getOrCreateReplyThreadConversation',
      title: 'Get or Create Reply Thread Conversation',
      description: 'Get or create a conversation for a reply thread',
    },
  },
}))
