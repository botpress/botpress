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
            .describe('Represent a single comment.')
        )
        .title('Comments')
        .describe('A list of comments.'),
    }),
  },
} satisfies ActionDefinition
