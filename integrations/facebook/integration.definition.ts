import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

const commonConfigSchema = z.object({
  downloadMedia: z
    .boolean()
    .default(false)
    .title('Download Media')
    .describe('Automatically download media files using the Files API for content access.'),
  downloadedMediaExpiry: z
    .number()
    .default(24)
    .optional()
    .title('Downloaded Media Expiry')
    .describe(
      'Expiry time in hours for downloaded media files. An expiry time of 0 means the files will never expire.'
    ),
  replyToComments: z
    .boolean()
    .default(false)
    .title('Reply to Comments')
    .describe('Whether to reply to comments on Facebook posts (limited to 1 reply per top-level comment)'),
})

export default new IntegrationDefinition({
  name: 'facebook',
  version: '0.1.0',
  title: 'Facebook',
  description: 'Automate interactions and manage comments on Facebook posts all in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
    schema: commonConfigSchema,
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Configure by manually supplying the Meta app details',
      schema: z
        .object({
          clientId: z.string().title('Client ID').min(1).describe('Meta app client id'),
          clientSecret: z
            .string()
            .title('Client Secret')
            .optional()
            .describe('Meta App secret used for webhook signature check. Leave empty to disable signature check.'),
          verifyToken: z
            .string()
            .title('Verify Token')
            .min(1)
            .describe(
              'Token used for verification when subscribing to webhooks on the Meta app (enter a random string of your choice)'
            ),
          accessToken: z
            .string()
            .title('Access Token')
            .min(1)
            .describe('Page access token that with permissions to access the Facebook page'),
          pageId: z.string().min(1).describe('Id from the Facebook page').title('Page ID'),
        })
        .merge(commonConfigSchema),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    commentReplies: {
      title: 'Comment Replies',
      description: 'Channel for replies to comments on Facebook posts',
      messages: messages.defaults,
      message: {
        tags: {
          id: { title: 'Comment ID', description: 'The unique ID of the comment' },
          postId: { title: 'Post ID', description: 'The Facebook post ID where the comment was posted' },
        },
      },
      conversation: {
        tags: {
          id: { title: 'Comment ID', description: 'The Facebook comment ID under which the reply was posted' },
          postId: { title: 'Post ID', description: 'The Facebook post ID where the comment was posted' },
        },
      },
    },
  },
  actions: {},
  events: {},
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        // TODO: Rename to 'userToken' if we bump a major
        accessToken: z.string().optional().title('Access token').describe('The access token obtained by OAuth'),
        pageToken: z
          .string()
          .optional()
          .title('Page token')
          .describe('The token used to authenticate API calls related to the page'),
        pageId: z.string().optional().title('Page ID').describe('The page ID'),
      }),
    },
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: {
      description: 'The client ID of your Meta app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Meta app',
    },
    OAUTH_CONFIG_ID: {
      description: 'The OAuth configuration ID for the OAuth Meta app',
    },
    VERIFY_TOKEN: {
      description: 'The verify token for the Meta Webhooks subscription',
    },
    ACCESS_TOKEN: {
      description: 'Access token for internal Meta App',
    },
    SANDBOX_CLIENT_ID: {
      description: 'The client ID of the Sandbox Meta app',
    },
    SANDBOX_CLIENT_SECRET: {
      description: 'The client secret of the Sandbox Meta app',
    },
    SANDBOX_VERIFY_TOKEN: {
      description: 'The verify token for the Sandbox Meta App Webhooks subscription',
    },
    SANDBOX_ACCESS_TOKEN: {
      description: 'Access token for the Sandbox Meta App',
    },
    SANDBOX_PAGE_ID: {
      description: 'Page ID for the Sandbox Facebook page',
    },
  },
  user: {
    tags: { id: { title: 'User ID', description: 'The Facebook ID of the user' } },
  },
  entities: {
    user: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Facebook ID of the user'),
        })
        .title('User')
        .describe('The user object fields'),
      title: 'User',
      description: 'A Facebook user',
    },
    conversation: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Facebook ID of the user in the conversation'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
      title: 'Conversation',
      description: 'A conversation with a Facebook user',
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
