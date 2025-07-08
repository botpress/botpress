import { z, IntegrationDefinition } from '@botpress/sdk'
import { sendEmailOutputSchema, sendMailInputSchema } from './definitions/actions'
import {
  BouncedEmailEventPayload,
  DeferredEmailEventPayload,
  DeliveredEmailEventPayload,
  WebhookEmailEventPayload,
} from './definitions/events'

export default new IntegrationDefinition({
  name: 'sendgrid',
  title: 'SendGrid',
  version: '0.1.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Send markdown rich-text emails using the SendGrid email service.',
  configuration: {
    schema: z.object({
      apiKey: z.string().secret().min(1).describe('Your SendGrid API Key').title('SendGrid API Key'),
    }),
  },
  actions: {
    sendMail: {
      title: 'Send Email',
      description: 'Sends an email to the specified client',
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
      title: 'Email Delivered',
      description:
        "An event that triggers when the SendGrid API delivers a given email to the recipient's email server. (This can also trigger alongside email bounces among other events)",
      schema: DeliveredEmailEventPayload,
    },
    bounced: {
      title: 'Email Bounced',
      description:
        'An event that triggers when an email sent via the SendGrid API bounces. (e.g. Invalid Address, blocked, etc)',
      schema: BouncedEmailEventPayload,
    },
    deferred: {
      title: 'Email Deferred',
      description:
        "An event that triggers when the SendGrid API fails a delivery attempt to the recipient's email server. (This will often re-attempt a few times before stopping)",
      schema: DeferredEmailEventPayload,
    },
    processed: {
      title: 'Email Processed',
      description: 'An event that triggers when the SendGrid API has processed an outbound email.',
      schema: WebhookEmailEventPayload,
    },
    opened: {
      title: 'Email Opened',
      description:
        "An event that triggers when the SendGrid API detects that an email has been opened by the recipient. (Must have 'Open Tracking' enabled)\n\nNote: This may be subject to privacy regulations of the email recipient's country",
      schema: WebhookEmailEventPayload,
    },
    clicked: {
      title: 'Email Link Clicked',
      description:
        "An event that triggers when the SendGrid API detects that a link in the email has been clicked on by the recipient.(Must have 'Click Tracking' enabled)\n\nNote: This may be subject to privacy regulations of the email recipient's country",
      schema: WebhookEmailEventPayload,
    },
  },
})
