import { z, EventDefinition } from '@botpress/sdk'

const webhookEvent = z.object({
  type: z.string().title('Type').describe('The type of event'),
  topic: z.string().title('Topic').describe('Topic of the event'),
  organizationId: z.string().title('Organization Id').describe('Organization associated with the event'),
  id: z.string().title('Id').describe('ID of the event'),
  webhookId: z.string().title('Webhook Id').describe('The ID of the webhook').optional(),
  createAt: z.string().title('Create At').describe('Date when the event was created').optional(),
  deliveryStatus: z.string().title('Delivery Status').describe('The status of the event').optional(),
  firstSentAt: z.string().title('First Sent At').describe('First delivery time').optional(),
  deliveryAttempts: z
    .number()
    .title('Delivery Attempts')
    .describe('The number of times the event tried to be delivered')
    .optional(),
})

const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
})

const postSchema = z.object({
  id: z.string().title('Id').optional(),
  type: z.string().title('Type').optional(),
  title: z.string().title('Title').optional(),
  content: z.string().title('Content').optional(),
  user: userSchema.title('User').optional(),
  postStatus: z
    .object({
      name: z.string().optional(),
      type: z.string().optional(),
      id: z.string().optional(),
    })
    .title('Post Status')
    .optional(),
  postCategory: z
    .object({
      category: z.string().optional(),
      id: z.string().optional(),
    })
    .title('Post Category')
    .optional(),
  date: z.string().title('Date').optional(),
  slug: z.string().title('Slug').optional(),
  categoryId: z.string().title('Category Id').optional(),
})

export const postCreated = {
  title: 'Post Created',
  description: 'A post was created on a board.',
  schema: webhookEvent.extend({
    data: z
      .object({
        item: postSchema,
      })
      .title('Data')
      .describe('Event data'),
  }),
} satisfies EventDefinition

export const postUpdated = {
  title: 'Post Updated',
  description: 'A post was updated on a board.',
  schema: webhookEvent.extend({
    data: z
      .object({
        item: postSchema,
        changes: z.array(
          z.object({
            field: z.string(),
            oldValue: z.any(),
            newValue: z.any(),
          })
        ),
      })
      .title('Data')
      .describe('Event data'),
  }),
} satisfies EventDefinition

export const postDeleted = {
  title: 'Post Deleted',
  description: 'A post was deleted on a board.',
  schema: webhookEvent.extend({
    data: z
      .object({
        item: postSchema,
      })
      .title('Data')
      .describe('Event data'),
  }),
} satisfies EventDefinition

export const postVoted = {
  title: 'Post voted',
  description: 'A post was voted on a board.',
  schema: webhookEvent.extend({
    data: z
      .object({
        item: z.object({
          type: z.string().optional(),
          action: z.string().optional(),
          submissionId: z.string().optional(),
          user: userSchema.optional(),
        }),
      })
      .title('Data')
      .describe('Event data'),
  }),
} satisfies EventDefinition
