import { z, ActionDefinition } from '@botpress/sdk'

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
      results: z
        .array(
          z
            .object({
              id: z.string().title('ID').describe('Comment ID'),
              upvoted: z.boolean().optional().title('Upvoted').describe('Whether the comment is upvoted'),
              downvoted: z.boolean().optional().title('Downvoted').describe('Whether the comment is downvoted'),
              inReview: z.boolean().optional().title('In Review').describe('Whether the comment is in review'),
              isSpam: z.boolean().optional().title('Is Spam').describe('Whether the comment is marked as spam'),
              pinned: z.boolean().optional().title('Pinned').describe('Whether the comment is pinned'),
              emailSent: z.boolean().optional().title('Email Sent').describe('Whether an email notification was sent'),
              sendNotification: z
                .boolean()
                .optional()
                .title('Send Notification')
                .describe('Whether to send notifications'),
              organization: z.string().optional().title('Organization').describe('Organization ID'),
              submission: z.string().optional().title('Submission').describe('Submission ID'),
              author: z.string().optional().title('Author').describe('Author name'),
              authorId: z.string().optional().title('Author ID').describe('Author ID'),
              authorPicture: z.string().optional().title('Author Picture').describe('Author profile picture URL'),
              isPrivate: z.boolean().optional().title('Is Private').describe('Whether the comment is private'),
              isDeleted: z.boolean().optional().title('Is Deleted').describe('Whether the comment is deleted'),
              content: z.string().optional().title('Content').describe('Comment content'),
              upvotes: z.number().optional().title('Upvotes').describe('Number of upvotes'),
              downvotes: z.number().optional().title('Downvotes').describe('Number of downvotes'),
              parentComment: z.string().nullable().optional().title('Parent Comment').describe('Parent comment ID'),
              path: z.string().optional().title('Path').describe('Comment path'),
            })
            .title('Comment')
            .describe('Represent a single comment.')
        )
        .title('Comments')
        .describe('A list of comments.'),
    }),
  },
} satisfies ActionDefinition
