import { z } from '@botpress/sdk'

export const createComment = {
  title: 'Create a comment',
  description: 'Create a comment on feature base',
  input: {
    schema: z.object({
      submissionId: z
        .string()
        .title('SubmissionId')
        .describe('The id of the submission to get comments for.')
        .optional(),
      changelogId: z
        .string()
        .title('changelogId')
        .describe(
          'The id of the changelog to get comments for. Accepts both ObjectId and slug. Example: "65f5f3c037fc63b7d43d0f16" or "my-changelog-slug"'
        )
        .optional(),
      content: z.string().title('Content').describe('The content of the comment.').optional(),
      parentCommentId: z
        .string()
        .title('Parent Comment ID')
        .describe('The id of the parent comment if this comment is a reply to another comment.')
        .optional(),
      isPrivate: z
        .boolean()
        .title('IsPrivate')
        .describe(
          'Flag indicating whether the comment is private. Private comments are visible only to admins of the organization.'
        )
        .optional(),
      sendNotification: z
        .boolean()
        .title('SendNotification')
        .describe('Flag indicating whether to notify voters of the submission about the comment. Defaults to true.')
        .optional(),
      createdAt: z.date().title('Type').describe('').optional(),
      author: z
        .object({
          name: z.string().title('Name').describe('Name of the user'),
          email: z.string().title('Email').describe('Email of the user'),
          profilePicture: z.string().title('Profile Picture').describe('Profile picture of the user'),
        })
        .title('Author')
        .optional()
        .describe(
          'Post the comment under a specific user. If not provided, the comment will be posted under the owner user of the Featurebase account.'
        ),
    }),
  },
  output: {
    schema: z.object({
      comment: z
        .object({
          id: z.string(),
        })
        .title('Comment')
        .describe('Represent the created comment.'),
    }),
  },
}
