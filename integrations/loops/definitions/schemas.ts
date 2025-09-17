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
  fileIds: z
    .array(z.string())
    .optional()
    .describe(
      'The Botpress client-generated IDs of the files to be attached to the email. They must have already been uploaded to your bot via the Files API. The name of the file will be used as the filename of the attachment. Use this for a list of templates the user can choose from.'
    )
    .title('File IDs'),
  fileData: z
    .array(z.object({ filename: z.string(), contentType: z.string(), data: z.string() }))
    .optional()
    .describe('The name, base64-encoded data, and MIME content type of custom files to be attached to the email.')
    .title('File Data'),
})

export const sendTransactionalEmailOutputSchema = z.object({})

const _commonEventSchema = z.object({
  eventName: z.string().title('Event Type').describe('The type of event as defined by Loops'),
  webhookSchemaVersion: z.string().title('Webhook Schema Version').describe('Will be 1.0.0 for all events'),
  eventTime: z.number().title('Event Time').describe('The Unix timestamp of the time the event occurred'),
})

const _baseEmailEventSchema = _commonEventSchema.extend({
  contactIdentity: z
    .object({
      id: z.string().title('Contact ID').describe('The ID of the contact assigned by Loops'),
      email: z.string().title('Contact Email').describe('The email address of the contact'),
      userId: z
        .string()
        .nullable()
        .title('Contact User ID')
        .describe('The unique user ID created by the contact. May be null'),
    })
    .title('Contact Identity')
    .describe('The identifiers of the contact. Includes the contact ID, email address, and user ID'),
  email: z
    .object({
      id: z.string().title('Email ID').describe('The ID of the email'),
      emailMessageId: z.string().title('Email Message ID').describe('The ID of the sent version of the email'),
      subject: z.string().title('Email Subject').describe('The subject of the sent version of the email'),
    })
    .title('Email Details')
    .describe(
      'The details about an individual email sent to a recipient. Includes the email ID, the ID of the sent version, and the subject'
    ),
})

export const campaignOrLoopEmailEventSchema = _baseEmailEventSchema.extend({
  sourceType: z
    .enum(['campaign', 'loop'])
    .title('Source Type')
    .describe('The type of email that triggered the event. One of campaign or loop'),
  campaignId: z
    .string()
    .optional()
    .title('Campaign ID')
    .describe('The ID of the campaign email. Only one of Campaign ID or Loop ID must exist.'),
  loopId: z
    .string()
    .optional()
    .title('Loop ID')
    .describe('The ID of the loop email. Only one of Campaign ID or Loop ID must exist.'),
})

export const fullEmailEventSchema = _baseEmailEventSchema.extend({
  sourceType: z
    .enum(['campaign', 'loop', 'transactional'])
    .title('Source Type')
    .describe('The type of email that triggered the event. One of campaign, loop, or transactional'),
  campaignId: z
    .string()
    .optional()
    .title('Campaign ID')
    .describe('The ID of the campaign email. Only one of Campaign ID or Loop ID must exist.'),
  loopId: z
    .string()
    .optional()
    .title('Loop ID')
    .describe('The ID of the loop email. Only one of Campaign ID or Loop ID must exist.'),
  transactionalId: z
    .string()
    .optional()
    .title('Transactional ID')
    .describe('The ID of the transactional email. Only one of Campaign ID, Loop ID, or Transactional ID must exist.'),
})
