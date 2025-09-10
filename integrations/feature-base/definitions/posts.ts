import { z } from '@botpress/sdk'

export const createPost = {
  title: 'Create a post',
  description: 'Create a post on feature base',
  input: {
    schema: z.object({
      title: z.string().describe('The title of the submission. It must be at least 2 characters long.'),
      category: z.string().describe('The board (a.k.a category) of the submission.'),
      content: z.string().optional().describe('The content of the submission. Can be an empty string.'),
      email: z
        .string()
        .optional()
        .describe(
          'The email of the user submitting the post. Will create a new user if the email is not associated with an existing user.'
        ),
      authorName: z
        .string()
        .optional()
        .describe(
          'Used when you provide an email. If the email is not associated with an existing user, a new user will be created with this name.'
        ),
      tags: z
        .array(z.string())
        .optional()
        .describe('The tags associated with the submission. Needs to be an array of tag names.'),
      commentsAllowed: z
        .boolean()
        .optional()
        .describe('Flag indicating whether comments are allowed on the submission.'),
      status: z.string().optional().describe('The status of the submission.'),
      date: z.date().optional().describe('Set the post creation date.'),
    }),
  },
  output: {
    schema: z.object({
      submission: z
        .object({
          id: z.string(),
        })
        .describe('Represent the created post.'),
    }),
  },
}

export const listPosts = {
  title: 'List posts',
  description: 'List all posts',
  input: {
    schema: z.object({
      id: z.string().optional().describe("Find submission by it's id."),
      q: z.string().optional().describe('Search for posts by title or content.'),
      category: z.array(z.string()).optional().describe('Filter posts by providing an array of category(board) names.'),
      status: z.array(z.string()).optional().describe('Filter posts by status ids.'),
      sortBy: z.string().optional().describe('Sort posts by a specific attribute.'),
      startDate: z.date().optional().describe('Get posts created after a specific date.'),
      endDate: z.date().optional().describe('Get posts created before a specific date.'),
      limit: z.number().optional().describe('Number of results per page'),
      page: z.number().optional().describe('Page number. Starts at 1'),
      nextToken: z.string().optional().describe('Page number. Starts at 1'),
    }),
  },
  output: {
    schema: z.object({
      nextToken: z.string().optional().describe('Use the token to fetch the next page of posts.'),
      results: z
        .array(
          z.object({
            title: z.string(),
            content: z.string(),
            author: z.string(),
            authorId: z.string(),
            organization: z.string(),
            postCategory: z.object({
              category: z.string(),
            }),
            id: z.string(),
          })
        )
        .describe('An array of posts.'),
    }),
  },
}

export const updatePost = {
  title: 'Update post',
  description: 'Update a post',
  input: {
    schema: z.object({
      id: z.string().describe('The id of the submission.'),
      title: z.string().optional().describe('The title of the post. Example: "Add dark mode support"'),
      content: z
        .string()
        .optional()
        .describe(
          'The HTML content of the post. Example: "<p>It would be great to have dark mode support for better viewing at night.</p>"'
        ),
      status: z.string().optional().describe('The status of the submission. Example: "In Progress"'),
      commentsAllowed: z
        .boolean()
        .optional()
        .describe('Flag indicating whether comments are allowed on the submission. Example: true'),
      category: z.string().optional().describe('The category of the submission. Example: "💡 Feature Request"'),
      sendStatusUpdateEmail: z
        .boolean()
        .optional()
        .describe('Flag indicating whether to send a status update email to the upvoters. Default: false'),
      tags: z.array(z.string()).optional().describe('The tags of the submission. Example: ["tag1", "tag2"]'),
      inReview: z
        .boolean()
        .optional()
        .describe('Flag indicating whether the submission is in review. In review posts are not visible to users.'),
      date: z.date().optional().describe('The post creation date.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
}

export const deletePost = {
  title: 'Delete post',
  description: 'Delete a post',
  input: {
    schema: z.object({
      id: z.string().describe('The id of the submission.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
}
