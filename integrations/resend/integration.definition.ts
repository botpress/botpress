import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendEmailOutputSchema, sendMailInputSchema } from './definitions/actions'
import {
  bouncedEmailEventSchema,
  clickedEmailLinkEventSchema,
  delayedDeliveryEmailEventSchema,
  deliveredEmailEventSchema,
  failedToSendEmailEventSchema,
  markedAsSpamEmailEventSchema,
  openedEmailEventSchema,
  sentEmailEventSchema,
} from './definitions/events'

export default new IntegrationDefinition({
  name: 'resend',
  title: 'Resend',
  version: '0.1.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Send markdown rich-text emails using the Resend email service.',
  configuration: {
    schema: z.object({
      apiKey: z.string().secret().min(1).describe('Your Resend API Key').title('Resend API Key'),
    }),
  },
  actions: {
    sendMail: {
      title: 'Send Email',
      description: 'Sends an email to the specified email address',
      input: {
        schema: sendMailInputSchema,
      },
      output: {
        schema: sendEmailOutputSchema,
      },
    },
  },
  events: {
    delivered: {
      title: 'Email delivered',
      description:
        "An event that triggers when the Resend API delivers an email to the recipient's email server. (This can also trigger alongside email bounces among other events)",
      schema: deliveredEmailEventSchema,
    },
    bounced: {
      title: 'Email bounced',
      description: 'An event that triggers when a sent email bounces. (e.g. Invalid Address, blocked, etc)',
      schema: bouncedEmailEventSchema,
    },
    delayedDelivery: {
      title: 'Email delivery delayed',
      description:
        "An event that triggers when the Resend API fails a delivery attempt to the recipient's email server. (This will usually re-attempt a few times before stopping)",
      schema: delayedDeliveryEmailEventSchema,
    },
    sent: {
      title: 'Email sent',
      description: 'An event that triggers when the Resend API has processed and sent the email.',
      schema: sentEmailEventSchema,
    },
    opened: {
      title: 'Email opened',
      description:
        "An event that triggers when the email has been opened by the recipient. (Must have 'Open Tracking' enabled)\n\nNote: This may be subject to privacy regulations of the email recipient's country",
      schema: openedEmailEventSchema,
    },
    clicked: {
      title: 'Email link clicked',
      description:
        "An event that triggers when a link in the email has been clicked on by the recipient. (Must have 'Click Tracking' enabled)\n\nNote: This may be subject to privacy regulations of the email recipient's country",
      schema: clickedEmailLinkEventSchema,
    },
    markedAsSpam: {
      title: 'Email marked as spam',
      description: 'An event that triggers when the sent email is marked as spam by the recipient.',
      schema: markedAsSpamEmailEventSchema,
    },
    // I was never able to trigger this event
    failed: {
      title: 'Email failed to send',
      description: 'An event that triggers when the email could not be sent at all.',
      schema: failedToSendEmailEventSchema,
    },
  },
})
