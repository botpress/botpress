import { EventDefinition, z } from '@botpress/sdk'
import { userSchema, webhookEvent } from '../events'

export const commentCreated = {
  title: 'Comment created',
  description: 'A comment was created on a post.',
  schema: webhookEvent.extend({
    topic: z.literal('comment.created').title('Topic').describe('The topic of the event'),
    data: z
      .object({
        item: z.object({
          type: z.string().optional(),
          id: z.string().optional(),
          content: z.string().optional(),
          user: userSchema.optional(),
          isPrivate: z.boolean().optional(),
          score: z.number().optional(),
          upvotes: z.number().optional(),
          downvotes: z.number().optional(),
          inReview: z.boolean().optional(),
          pinned: z.boolean().optional(),
          emailSent: z.boolean().optional(),
          sendNotification: z.boolean().optional(),
          createdAt: z.string().optional(),
          updatedAt: z.string().optional(),
          organization: z.string().optional(),
          submission: z.string().optional(),
          path: z.string().optional(),
        }),
      })
      .title('Data')
      .describe('Event data'),
  }),
} satisfies EventDefinition

export type CommentCreatedPayload = z.infer<typeof commentCreated.schema>
