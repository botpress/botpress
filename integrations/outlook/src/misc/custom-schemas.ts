import * as z from 'zod'

export const htmlSchema = z.object({ content: z.string() })

export const notificationContentSchema = z
  .object({
    body: z.object({
      content: z.string(),
      contentType: z.string(),
    }),
    sender: z.object({
      emailAddress: z.object({
        address: z.string(),
      }),
    }),
    from: z.object({
      emailAddress: z.object({
        address: z.string(),
      }),
    }),
    toRecipients: z.array(
      z.object({
        emailAddress: z.object({
          address: z.string(),
        }),
      })
    ),
    ccRecipients: z.array(
      z.object({
        emailAddress: z.object({
          address: z.string(),
        }),
      })
    ),
    conversationId: z.string(),
    subject: z.string(),
    id: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.body.content === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid email body: ${JSON.stringify(val, null, 3)}`,
        path: ['body', 'content'],
      })
    }
    if (val.sender.emailAddress.address === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing sender property: ${JSON.stringify(val, null, 3)}`,
        path: ['sender', 'emailAddress', 'address'],
      })
    }
  })
