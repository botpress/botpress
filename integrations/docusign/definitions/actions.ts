import { z } from '@botpress/sdk'

const _templateRecipientSchema = z.object({
  name: z.string().title('Recipient Name').describe("The recipient's full name"),
  email: z.string().title('Recipient Email').describe("The recipient's email address"),
  role: z.string().title('Template Recipient Role').describe('The role keyword defined in the template'),
  accessCode: z
    .string()
    .optional()
    .title('Access Code')
    .describe('An access code that is required to access the envelope'),
})
export type TemplateRecipient = z.infer<typeof _templateRecipientSchema>

export const sendEnvelopeInputSchema = z.object({
  templateId: z.string().title('Template ID').describe('The id of the envelope template'),
  recipients: z
    .array(_templateRecipientSchema)
    .min(1)
    .title('Envelope Recipients')
    .describe(
      "The recipients of the envelope to send as defined in the template (Note: adding additional recipients with roles not defined in the template will cause them to default as 'signers')"
    ),
  emailSubject: z
    .string()
    .optional()
    .title('Email Subject')
    .describe(
      'Sets the subject field of the sent envelope email (Leaving this empty will fallback to the template default subject)'
    ),
  conversationId: z
    .string()
    .placeholder('{{ event.conversationId }}')
    .optional()
    .title('Conversation ID')
    .describe('The ID of the conversation'),
})
export type SendEnvelopeInput = z.infer<typeof sendEnvelopeInputSchema>

export const sendEnvelopeOutputSchema = z.object({
  envelopeId: z.string().title('Envelope ID').describe('The id of the sent envelope'),
})
