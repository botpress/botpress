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

export const getComments = {
  title: 'Get Comments',
  description: 'Get a comments thread',
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
      privacy: z
        .enum(['public', 'private', 'all'])
        .title('Privacy')
        .describe('Filter comments by privacy setting. Allowed values: "public", "private", "all"')
        .optional(),
      inReview: z
        .boolean()
        .title('In Review')
        .describe('Filter comments by whether they are in review. Set to true to get only comments that are in review.')
        .optional(),
      commentThreadId: z
        .string()
        .title('Comment Thread Id')
        .describe(
          'Given a specific comment id, this will return all comments in the thread with the root comment being the comment with the given id.'
        )
        .optional(),
      limit: z.number().title('Limit').describe('Number of results per page. Default is 10.').optional(),
      page: z.number().title('Page').describe('Page number. Default is 1.').optional(),
      sortBy: z.enum(['best', 'top', 'new', 'old']).title('SortBy').describe('Sort order of the results.').optional(),
      nextToken: z.string().title('Next Token').optional().describe('Page number. Starts at 1'),
    }),
  },
  output: {
    schema: z.object({
      results: z.array(
        z
          .object({
            id: z.string(),
            upvoted: z.boolean().optional(),
            downvoted: z.boolean().optional(),
            inReview: z.boolean().optional(),
            isSpam: z.boolean().optional(),
            pinned: z.boolean().optional(),
            emailSent: z.boolean().optional(),
            sendNotification: z.boolean().optional(),
            organization: z.string().optional(),
            submission: z.string().optional(),
            author: z.string().optional(),
            authorId: z.string().optional(),
            authorPicture: z.string().optional(),
            isPrivate: z.boolean().optional(),
            isDeleted: z.boolean().optional(),
            content: z.string().optional(),
            upvotes: z.number().optional(),
            downvotes: z.number().optional(),
            parentComment: z.string().nullable().optional(),
            path: z.string().optional(),
          })
          .title('Comment')
          .describe('Represent the created comment.')
      ),
    }),
  },
}
