import { z } from '@botpress/sdk'

export const issuesToCheckSchema = z.array(
  z.object({
    id: z.string().title('ID').describe('The ID of the issue'),
    sinceTimestamp: z
      .number()
      .title('Since Timestamp')
      .describe('The timestamp of when the issue was put in this status'),
    commentId: z
      .string()
      .optional()
      .title('Comment ID')
      .describe('The ID of the comment made on the issue by the bot if there is one'),
  })
)
