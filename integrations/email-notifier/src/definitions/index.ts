import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const actions = {
  sendMail: {
    title: 'Send Email',
    description: 'Send an email via AWS SES',
    input: {
      schema: z.object({
        to: z.array(z.string().email()).describe('Recipient email addresses').min(1).max(50),
        subject: z.string().min(1).max(998).describe('Email subject'),
        body: z.string().optional().describe('Email content - supports plain text or HTML'),
        isHtml: z.boolean().optional().default(false).describe('Set to true if body contains HTML content'),
        replyTo: z.array(z.string().email()).optional().describe('Reply to email addresses'),
      }),
    },
    output: {
      schema: z.object({
        successful: z.array(z.object({ email: z.string().email(), messageId: z.string() })),
        failed: z.array(z.object({ email: z.string().email(), error: z.string() })),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']

export const states = {} satisfies IntegrationDefinitionProps['states']

export const events = {
  emailSent: {
    title: 'Email Sent',
    description: 'Triggered when an email is successfully sent via AWS SES',
    schema: z.object({
      messageId: z.string().describe('AWS SES Message ID'),
      to: z.array(z.string().email()).describe('Recipient email addresses'),
      subject: z.string().describe('Email subject'),
      fromEmail: z.string().email().describe('Sender email address'),
      timestamp: z.string().describe('ISO timestamp when email was sent'),
    }),
  },
} satisfies IntegrationDefinitionProps['events']
