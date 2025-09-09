import { z } from '@botpress/sdk'

const commentModel = {
  id: z.string().describe('The id of the comment.'),
  content: z
    .string()
    .describe(
      'The HTML content of the comment. Images with external URLs or base64 data URIs are automatically processed and stored in our system.'
    ),
  author: z.string().describe('The name of the author of the comment.'),
  authorId: z.string().describe('The id for the author of the comment.'),
  authorPicture: z.string().describe('The profile picture of the author of the comment.'),
  isPrivate: z
    .boolean()
    .optional()
    .describe(
      'Flag indicating whether the comment is private. Private comments are visible only to admins of the organization.'
    ),
  isDeleted: z.boolean().optional().describe('Flag indicating whether the comment has been deleted.'),
  upvotes: z.number().describe('The number of upvotes the comment has received.'),
  downvotes: z.number().describe('The number of downvotes the comment has received.'),
  score: z
    .number()
    .describe(
      'The score of the comment. Calculated by subtracting the number of downvotes from the number of upvotes.'
    ),
  submission: z
    .string()
    .describe('The id of the Featurebase submission if this comment is associated with a submission.'),
  changelog: z.string().describe('The id of the Featurebase changelog if this comment is associated with a changelog.'),
  parentComment: z.string().describe('The id of the parent comment if this comment is a reply to another comment.'),
  path: z
    .string()
    .describe(
      'The "path" is a string made up of IDs separated by slashes (\'/\'). It shows the series of steps to reach a specific comment. The first ID in the string refers to either a submission or changelog. Following IDs represent each parent comment, leading up to the top-level comment. The ID of the comment this path relates to is not included in this string.'
    ),
  organization: z.string().describe('The id of the organization the comment belongs to.'),
  createdAt: z.date().describe('The date when the comment was created.'),
  originalSubmission: z
    .string()
    .describe('The id of the original submission if this comment was merged from another submission.'),
  postStatus: z
    .string()
    .describe(
      'Status change comments have a post status associated with them. This is the status the post was changed to by the status name.'
    ),
  inReview: z.boolean().optional().describe('Flag indicating whether the comment is currently under review.'),
  pinned: z.boolean().optional().describe('Flag indicating whether the comment is pinned.'),
}

export const getComments = {
  title: 'List comments',
  description: 'List comments for a post or changelog',
  input: {
    schema: z.object({
      submissionId: z.string().optional().describe('The id of the submission to get comments for.'),
      changelogId: z.string().optional().describe('The id of the changelog to get comments for.'),
      privacy: z
        .enum(['public', 'private', 'all'])
        .optional()
        .describe('Filter comments by privacy setting. Allowed values: "public", "private", "all"'),
      inReview: z
        .boolean()
        .optional()
        .describe(
          'Filter comments by whether they are in review. Set to true to get only comments that are in review.'
        ),
      commentThreadId: z
        .string()
        .optional()
        .describe(
          'Given a specific comment id, this will return all comments in the thread with the root comment being the comment with the given id.'
        ),
      limit: z.number().optional().describe('Number of results per page. Default is 10.'),
      page: z.number().optional().describe('Page number. Default is 1.'),
      sortBy: z
        .enum(['best', 'top', 'new', 'old'])
        .optional()
        .describe('Sort order of the results. Allowed values: "best", "top", "new", "old"'),
    }),
  },
  output: {
    schema: z.object({
      results: z.array(z.object(commentModel)),
    }),
  },
}

export const createComment = {
  title: 'Create comment',
  description: 'Create a comment on a post or a changelog',
  input: {
    schema: z.object({
      submissionId: z.string().optional().describe('The id of the submission to add a comment on.'),
      changelogId: z.string().optional().describe('The id of the changelog to add a comments on.'),
      content: z.string().describe('The content of the comment.'),
      parentCommentId: z
        .string()
        .optional()
        .describe('The id of the parent comment if this comment is a reply to another comment.'),
      isPrivate: z
        .boolean()
        .optional()
        .describe(
          'Flag indicating whether the comment is private. Private comments are visible only to admins of the organization.'
        ),
      sendNotification: z
        .boolean()
        .optional()
        .describe('Flag indicating whether to notify voters of the submission about the comment. Defaults to true.'),
      createdAt: z
        .date()
        .optional()
        .describe('Set the date when the comment was created. Useful for importing comments from other platforms.'),
      author: z
        .object({
          name: z.string(),
          email: z.string(),
          profilePicture: z.string(),
        })
        .optional()
        .describe(
          'Post the comment under a specific user. If not provided, the comment will be posted under the owner user of the Featurebase account.'
        ),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      comment: z.object(commentModel),
    }),
  },
}
