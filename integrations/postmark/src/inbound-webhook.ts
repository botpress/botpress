import * as sdk from '@botpress/sdk'

const emailRecipientSchema = sdk.z.object({
  Email: sdk.z.string(),
  Name: sdk.z.string(),
  MailboxHash: sdk.z.string(),
})

const headerSchema = sdk.z.object({
  Name: sdk.z.string(),
  Value: sdk.z.string(),
})

const attachmentSchema = sdk.z.object({
  Name: sdk.z.string(),
  Content: sdk.z.string(),
  ContentType: sdk.z.string(),
  ContentLength: sdk.z.number(),
  ContentID: sdk.z.string().optional().default(''),
})

export type Attachment = sdk.z.infer<typeof attachmentSchema>

export const postmarkInboundWebhookSchema = sdk.z.object({
  From: sdk.z.string(),
  MessageStream: sdk.z.string().optional().default(''),
  FromName: sdk.z.string().optional().default(''),
  FromFull: emailRecipientSchema,
  To: sdk.z.string(),
  ToFull: sdk.z.array(emailRecipientSchema),
  Cc: sdk.z.string().optional().default(''),
  CcFull: sdk.z.array(emailRecipientSchema).optional().default([]),
  Bcc: sdk.z.string().optional().default(''),
  BccFull: sdk.z.array(emailRecipientSchema).optional().default([]),
  OriginalRecipient: sdk.z.string().optional().default(''),
  ReplyTo: sdk.z.string().optional().default(''),
  Subject: sdk.z.string(),
  MessageID: sdk.z.string(),
  Date: sdk.z.string(),
  MailboxHash: sdk.z.string().optional().default(''),
  TextBody: sdk.z.string().optional().default(''),
  HtmlBody: sdk.z.string().optional().default(''),
  StrippedTextReply: sdk.z.string().optional().default(''),
  Tag: sdk.z.string().optional().default(''),
  Headers: sdk.z.array(headerSchema).optional().default([]),
  Attachments: sdk.z.array(attachmentSchema).optional().default([]),
})
