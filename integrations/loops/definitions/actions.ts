import { z } from '@botpress/sdk'

export const sendTransactionalEmailInputSchema = z.object({
  email: z.string().describe('The email address of the recipient.').title('Email'),
  transactionalId: z.string().describe('The ID of the transactional email to send.').title('Transactional ID'),
  dataVariables: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .describe('An object containing data as defined by the data variables added to the transactional email template.')
    .title('Data Variables'),
  addToAudience: z
    .boolean()
    .optional()
    .describe(
      'If true, a contact will be created in your audience using the email value (if a matching contact doesn’t already exist).'
    )
    .title('Add to Audience'),
  idempotencyKey: z
    .string()
    .optional()
    .describe(
      'Optionally send an idempotency key to avoid duplicate requests. The value should be a string of up to 100 characters and should be unique for each request. We recommend using V4 UUIDs or some other method with enough guaranteed entropy to avoid collisions during a 24 hour window. The endpoint will return a 409 Conflict response if the idempotency key has been used in the previous 24 hours.'
    )
    .title('Idempotency Key'),
})

export const sendTransactionalEmailOutputSchema = z.object({})
