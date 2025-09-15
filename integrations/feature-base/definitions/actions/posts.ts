import { z, ActionDefinition } from '@botpress/sdk'

export const createPost = {
  title: 'Create a post',
  description: 'Create a post on feature base',
  input: {
    schema: z.object({
      title: z.string().title('Title').describe('The title of the submission. It must be at least 2 characters long.'),
      category: z.string().title('Category').describe('The board (a.k.a category) of the submission.'),
      content: z
        .string()
        .title('Content')
        .optional()
        .describe('The content of the submission. Can be an empty string.'),
      email: z
        .string()
        .title('Email')
        .optional()
        .describe(
          'The email of the user submitting the post. Will create a new user if the email is not associated with an existing user.'
        ),
      authorName: z
        .string()
        .title('Author Name')
        .optional()
        .describe(
          'Used when you provide an email. If the email is not associated with an existing user, a new user will be created with this name.'
        ),
      tags: z
        .array(z.string())
        .title('Tags')
        .optional()
        .describe('The tags associated with the submission. Needs to be an array of tag names.'),
      commentsAllowed: z
        .boolean()
        .title('Comments Allowed')
        .optional()
        .describe('Flag indicating whether comments are allowed on the submission.'),
      status: z.string().title('Status').optional().describe('The status of the submission.'),
      date: z.date().title('Date').optional().describe('Set the post creation date.'),
    }),
  },
  output: {
    schema: z.object({
      submission: z
        .object({
          id: z.string(),
        })
        .title('Submission')
        .describe('Represent the created post.'),
    }),
  },
} satisfies ActionDefinition

export const listPosts = {
  title: 'List posts',
  description: 'List all posts',
  input: {
    schema: z.object({
      id: z.string().title('ID').optional().describe("Find submission by it's id."),
      q: z.string().title('Query').optional().describe('Search for posts by title or content.'),
      category: z
        .array(z.string())
        .title('Category')
        .optional()
        .describe('Filter posts by providing an array of category(board) names.'),
      status: z.array(z.string()).title('Status').optional().describe('Filter posts by status ids.'),
      sortBy: z.string().title('Sort By').optional().describe('Sort posts by a specific attribute.'),
      startDate: z.date().title('Start Date').optional().describe('Get posts created after a specific date.'),
      endDate: z.date().title('End Date').optional().describe('Get posts created before a specific date.'),
      limit: z.number().title('Limit').optional().describe('Number of results per page'),
      page: z.number().title('Page').optional().describe('Page number. Starts at 1'),
      nextToken: z.string().title('Next Token').optional().describe('Page number. Starts at 1'),
    }),
  },
  output: {
    schema: z.object({
      nextToken: z.string().title('Next Token').optional().describe('Use the token to fetch the next page of posts.'),
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
        .title('Results')
        .describe('An array of posts.'),
    }),
  },
} satisfies ActionDefinition

export const updatePost = {
  title: 'Update post',
  description: 'Update a post',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the submission.'),
      title: z.string().title('Title').optional().describe('The title of the post. Example: "Add dark mode support"'),
      content: z
        .string()
        .title('Content')
        .optional()
        .describe(
          'The HTML content of the post. Example: "<p>It would be great to have dark mode support for better viewing at night.</p>"'
        ),
      status: z.string().title('Status').optional().describe('The status of the submission. Example: "In Progress"'),
      commentsAllowed: z
        .boolean()
        .title('Comments Allowed')
        .optional()
        .describe('Flag indicating whether comments are allowed on the submission. Example: true'),
      category: z
        .string()
        .title('Category')
        .optional()
        .describe('The category of the submission. Example: "💡 Feature Request"'),
      sendStatusUpdateEmail: z
        .boolean()
        .title('Send Status Update Email')
        .optional()
        .describe('Flag indicating whether to send a status update email to the upvoters. Default: false'),
      tags: z
        .array(z.string())
        .title('Tags')
        .optional()
        .describe('The tags of the submission. Example: ["tag1", "tag2"]'),
      inReview: z
        .boolean()
        .title('In Review')
        .optional()
        .describe('Flag indicating whether the submission is in review. In review posts are not visible to users.'),
      date: z.date().title('Date').optional().describe('The post creation date.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} satisfies ActionDefinition

export const deletePost = {
  title: 'Delete post',
  description: 'Delete a post',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the submission.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} satisfies ActionDefinition
