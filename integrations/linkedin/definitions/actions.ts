import * as sdk from '@botpress/sdk'

const { z } = sdk

export const actions = {
  createPost: {
    title: 'Create Post',
    description: 'Create a LinkedIn post with optional image or article link',
    input: {
      schema: z.object({
        text: z
          .string()
          .min(1)
          .max(3000)
          .title('Post Text')
          .describe('The text content of your LinkedIn post (required, max 3000 characters)'),
        visibility: z
          .enum(['PUBLIC', 'CONNECTIONS'])
          .title('Visibility')
          .describe('Who can see this post: PUBLIC (anyone) or CONNECTIONS (1st degree only)'),
        imageUrl: z
          .string()
          .url()
          .optional()
          .title('Image URL')
          .describe(
            'URL of an image to attach (JPG, PNG, GIF, max 8MB). The image will be downloaded and uploaded to LinkedIn. If both imageUrl and articleUrl are provided, only the image will be used.'
          ),
        articleUrl: z
          .string()
          .url()
          .optional()
          .title('Article URL')
          .describe(
            'URL of an article/link to share. LinkedIn will generate a preview card. Ignored if imageUrl is provided.'
          ),
        articleTitle: z.string().optional().title('Article Title').describe('Custom title for the article preview.'),
        articleDescription: z
          .string()
          .optional()
          .title('Article Description')
          .describe(
            'Custom description for the article preview (optional - LinkedIn will scrape from URL if not provided)'
          ),
      }),
    },
    output: {
      schema: z.object({
        postUrn: z
          .string()
          .title('Post URN')
          .describe('The URN identifier of the created post (e.g., urn:li:ugcPost:123456)'),
        postUrl: z.string().title('Post URL').describe('Direct link to view the post on LinkedIn'),
      }),
    },
  },

  deletePost: {
    title: 'Delete Post',
    description: 'Delete a LinkedIn post created by the authenticated user',
    input: {
      schema: z.object({
        postUrn: z
          .string()
          .title('Post URN')
          .describe('The URN of the post to delete (e.g., urn:li:ugcPost:123456 or urn:li:share:123456)'),
      }),
    },
    output: {
      schema: z.object({
        success: z.boolean().title('Success').describe('Whether the post was successfully deleted'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
