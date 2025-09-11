import { z } from '@botpress/sdk'

const webookEvent = {
  type: z.string(),
  topic: z.string(),
  organizationId: z.string(),
  id: z.string(),
  webookId: z.string().optional(),
  createAt: z.string().optional(),
  deliveryStatus: z.string().optional(),
  firstSentAt: z.string().optional(),
  deliveryAttempts: z.number().optional(),
}

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
  schema: z.object({
    ...webookEvent,
    data: z.object({
      item: postSchema,
    }),
  }),
}

export const postUpdated = {
  title: 'Post Updated',
  description: 'A post was updated on a board.',
  schema: z.object({
    ...webookEvent,
    data: z.object({
      item: postSchema,
      changes: z.array(
        z.object({
          field: z.string(),
          oldValue: z.any(),
          newValue: z.any(),
        })
      ),
    }),
  }),
}

export const postDeleted = {
  title: 'Post Deleted',
  description: 'A post was deleted on a board.',
  schema: z.object({
    ...webookEvent,
    data: z.object({ item: postSchema }),
  }),
}

export const postVoted = {
  title: 'Post voted',
  description: 'A post was voted on a board.',
  schema: z.object({
    ...webookEvent,
    data: z.object({
      item: z.object({
        type: z.string().optional(),
        action: z.string().optional(),
        submissionId: z.string().optional(),
        user: userSchema.optional(),
      }),
    }),
  }),
}

export const webookEventSchema = z.object(webookEvent)
