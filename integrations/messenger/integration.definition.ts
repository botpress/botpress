import { posthogHelper } from '@botpress/common'
import { z, IntegrationDefinition } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'
import { messages } from './definitions/channels/channel/messages'

export const INTEGRATION_NAME = 'messenger'
export const INTEGRATION_VERSION = '5.0.3'

const commonConfigSchema = z.object({
  downloadMedia: z
    .boolean()
    .default(false)
    .title('Download Media')
    .describe(
      'Automatically download media files using the Files API for content access. If disabled, Messenger media URLs will be used.'
    ),
  downloadedMediaExpiry: z
    .number()
    .default(24)
    .optional()
    .title('Downloaded Media Expiry')
    .describe(
      'Expiry time in hours for downloaded media files. An expiry time of 0 means the files will never expire.'
    ),
})

const replyToCommentsSchema = z.object({
  replyToComments: z
    .boolean()
    .default(false)
    .title('Reply to Comments')
    .describe('Whether to reply to comments on Facebook posts (limited to 1 reply per top-level comment)'),
})

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'Messenger and Facebook',
  description:
    'Give your bot access to one of the world’s largest messaging platforms and manage your Facebook page content in one place.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
    schema: commonConfigSchema.merge(replyToCommentsSchema),
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
          shouldGetUserProfile: z
            .boolean()
            .default(true)
            .optional()
            .describe('Whether to get the user profile infos from Messenger when creating a new user')
            .title('Get User Profile'),
        })
        .merge(commonConfigSchema)
        .merge(replyToCommentsSchema),
    },
    sandbox: {
      title: 'Sandbox Configuration',
      description: 'Sandbox configuration, for testing purposes only',
      schema: commonConfigSchema,
      identifier: {
        linkTemplateScript: 'sandboxLinkTemplate.vrl',
      },
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    channel: {
      title: 'Messenger conversation',
      description: 'Channel for a Messenger conversation',
      messages,
      message: {
        tags: {
          id: { title: 'Message ID', description: 'The Messenger ID of the message' },
          commentId: {
            title: 'Comment ID',
            description: 'The Messenger ID of the comment for which the message is a private-reply to',
          },
          recipientId: { title: 'Recipient ID', description: 'The Messenger ID of the recipient' },
          senderId: { title: 'Sender ID', description: 'The Messenger ID of the sender' },
        },
      },
      conversation: {
        tags: {
          id: { title: 'Conversation ID', description: 'The Messenger user ID of the user in the conversation' },
          commentId: {
            title: 'Comment ID',
            description: 'The Messenger ID of the comment from which the private-reply conversation was created',
          },
          lastCommentId: {
            title: 'Last Comment ID',
            description: 'The Messenger ID of the comment from which a private-reply message was last sent',
          },
        },
      },
    },
    commentReplies: {
      title: 'Comment Replies',
      description: 'Channel for replies to comments on Facebook posts',
      messages: { text: sdk.messages.defaults.text },
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
          userId: { title: 'User ID', description: 'The Facebook user ID of the user who posted the comment' },
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
    ...posthogHelper.COMMON_SECRET_NAMES,
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
    SHOULD_GET_USER_PROFILE: {
      description: "Whether to get the user profile infos from Messenger when creating a new user ('true' or 'false')",
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
    SANDBOX_SHOULD_GET_USER_PROFILE: {
      description: "Whether to get the user profile infos from Messenger when creating a new user ('true' or 'false')",
    },
  },
  user: {
    tags: { id: { title: 'User ID', description: 'The Messenger ID of the user' } },
  },
  entities: {
    user: {
      schema: z
        .object({
          id: z.string().title('User ID').describe('The Messenger ID of the user'),
        })
        .title('User')
        .describe('The user object fields'),
      title: 'User',
      description: 'A Messenger user',
    },
    conversation: {
      schema: z
        .object({
          userId: z.string().title('User ID').describe('The Messenger user ID of the user in the conversation'),
          commentId: z
            .string()
            .optional()
            .title('Comment ID')
            .describe('The Messenger ID of the comment for which the private-reply conversation should be created'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
      title: 'Conversation',
      description: 'A conversation with a Messenger user',
    },
  },
})
  .extend(typingIndicator, () => ({ entities: {} }))
  .extend(proactiveUser, ({ entities }) => ({
    entities: {
      user: entities.user,
    },
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.conversation,
    },
  }))
