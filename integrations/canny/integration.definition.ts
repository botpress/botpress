import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('Your Canny API key'),
      defaultAuthorID: z.string().optional().describe('Default author ID for system messages'),
    }),
  },
  channels: {
    posts: {
      title: 'Posts',
      description: 'Channel for Canny posts and comments',
      messages: {
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
        image: {
          schema: z.object({
            imageUrl: z.string(),
            caption: z.string().optional(),
          }),
        },
      },
      conversation: {
        tags: {
          cannyPostId: {
            title: 'Post ID',
            description: 'The Canny post ID',
          },
          cannyBoardId: {
            title: 'Board ID',
            description: 'The Canny board ID',
          },
        },
      },
      message: {
        tags: {
          cannyType: {
            title: 'Type',
            description: 'Whether this is a post or comment',
          },
          cannyPostId: {
            title: 'Post ID',
            description: 'The associated post ID',
          },
          cannyCommentId: {
            title: 'Comment ID',
            description: 'The comment ID (if applicable)',
          },
        },
      },
    },
  },
  actions: {
    // Post actions
    createPost: {
      title: 'Create Post',
      description: 'Create a new post in Canny',
      input: {
        schema: z.object({
          authorID: z
            .string()
            .optional()
            .describe('The author ID (defaults to BotpressIntegration user if not provided)'),
          boardID: z.string().describe('The board ID'),
          title: z.string().describe('Post title'),
          details: z.string().describe('Post details'),
          byID: z.string().optional().describe('Admin ID who created the post'),
          categoryID: z.string().optional().describe('Category ID'),
          ownerID: z.string().optional().describe('Owner ID'),
          imageURLs: z.array(z.string()).optional().describe('Image URLs'),
          eta: z.string().optional().describe('ETA (MM/YYYY)'),
          etaPublic: z.boolean().optional().describe('Make ETA public'),
          customFields: z.record(z.any()).optional().describe('Custom fields'),
        }),
      },
      output: {
        schema: z.object({
          postId: z.string(),
        }),
      },
    },
    getPost: {
      title: 'Get Post',
      description: 'Retrieve a post by ID',
      input: {
        schema: z.object({
          postID: z.string().describe('The post ID'),
          boardID: z.string().optional().describe('The board ID'),
        }),
      },
      output: {
        schema: z.object({
          post: z.object({
            id: z.string(),
            title: z.string(),
            details: z.string().optional(),
            authorName: z.string().optional(),
            authorEmail: z.string().optional(),
            boardName: z.string(),
            status: z.string(),
            score: z.number(),
            commentCount: z.number(),
            created: z.string(),
            url: z.string(),
          }),
        }),
      },
    },
    listPosts: {
      title: 'List Posts',
      description: 'List posts with optional filters',
      input: {
        schema: z.object({
          boardID: z.string().optional(),
          authorID: z.string().optional(),
          companyID: z.string().optional(),
          tagIDs: z.array(z.string()).optional(),
          limit: z.number().optional(),
          skip: z.number().optional(),
          search: z.string().optional(),
          sort: z.enum(['newest', 'oldest', 'relevance', 'score', 'statusChanged', 'trending']).optional(),
          status: z.string().optional(),
        }),
      },
      output: {
        schema: z.object({
          posts: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              details: z.string().optional(),
              authorName: z.string().optional(),
              authorEmail: z.string().optional(),
              boardName: z.string(),
              status: z.string(),
              score: z.number(),
              commentCount: z.number(),
              created: z.string(),
              url: z.string(),
            })
          ),
          hasMore: z.boolean(),
        }),
      },
    },
    updatePost: {
      title: 'Update Post',
      description: 'Update an existing post',
      input: {
        schema: z.object({
          postID: z.string().describe('The post ID'),
          title: z.string().optional(),
          details: z.string().optional(),
          eta: z.string().optional(),
          etaPublic: z.boolean().optional(),
          imageURLs: z.array(z.string()).optional(),
          customFields: z.record(z.any()).optional(),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean(),
        }),
      },
    },
    deletePost: {
      title: 'Delete Post',
      description: 'Delete a post',
      input: {
        schema: z.object({
          postID: z.string().describe('The post ID to delete'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean(),
        }),
      },
    },

    // Comment actions
    createComment: {
      title: 'Create Comment',
      description: 'Create a new comment on a post',
      input: {
        schema: z.object({
          authorID: z
            .string()
            .optional()
            .describe('The author ID (defaults to BotpressIntegration user if not provided)'),
          postID: z.string().describe('The post ID'),
          value: z.string().describe('Comment text'),
          parentID: z.string().optional().describe('Parent comment ID for replies'),
          imageURLs: z.array(z.string()).optional().describe('Image URLs'),
          internal: z.boolean().optional().describe('Whether this is an internal comment'),
          shouldNotifyVoters: z.boolean().optional().describe('Notify voters'),
          createdAt: z.string().optional().describe('Created timestamp'),
        }),
      },
      output: {
        schema: z.object({
          commentId: z.string(),
        }),
      },
    },
    getComment: {
      title: 'Get Comment',
      description: 'Retrieve a comment by ID',
      input: {
        schema: z.object({
          commentID: z.string().describe('The comment ID'),
        }),
      },
      output: {
        schema: z.object({
          comment: z.object({
            id: z.string(),
            value: z.string(),
            authorName: z.string(),
            authorEmail: z.string(),
            postTitle: z.string(),
            postID: z.string(),
            created: z.string(),
            internal: z.boolean(),
            likeCount: z.number(),
          }),
        }),
      },
    },
    listComments: {
      title: 'List Comments',
      description: 'List comments with optional filters',
      input: {
        schema: z.object({
          postID: z.string().optional(),
          authorID: z.string().optional(),
          boardID: z.string().optional(),
          companyID: z.string().optional(),
          limit: z.number().optional(),
          skip: z.number().optional(),
        }),
      },
      output: {
        schema: z.object({
          comments: z.array(
            z.object({
              id: z.string(),
              value: z.string(),
              authorName: z.string(),
              authorEmail: z.string(),
              postTitle: z.string(),
              postID: z.string(),
              created: z.string(),
              internal: z.boolean(),
              likeCount: z.number(),
            })
          ),
          hasMore: z.boolean(),
        }),
      },
    },
    deleteComment: {
      title: 'Delete Comment',
      description: 'Delete a comment',
      input: {
        schema: z.object({
          commentID: z.string().describe('The comment ID to delete'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean(),
        }),
      },
    },

    // User management actions
    createOrUpdateUser: {
      title: 'Create or Update User',
      description: 'Create a new user or update an existing one in Canny',
      input: {
        schema: z.object({
          name: z.string().min(1).max(50).describe('User display name (required, 1-50 characters)'),
          userID: z.string().optional().describe('Your internal user ID'),
          email: z.string().optional().describe('User email address'),
          avatarURL: z.string().optional().describe('User avatar URL'),
          alias: z.string().optional().describe('User alias'),
          created: z.string().optional().describe('User creation timestamp'),
          customFields: z.record(z.any()).optional().describe('Custom fields'),
        }),
      },
      output: {
        schema: z.object({
          user: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            avatarURL: z.string().optional(),
            userID: z.string(),
            isAdmin: z.boolean(),
            created: z.string(),
          }),
        }),
      },
    },
    listUsers: {
      title: 'List Users',
      description: 'List all users in your Canny workspace with pagination',
      input: {
        schema: z.object({
          limit: z.number().min(1).max(100).optional().describe('Number of users to fetch (1-100, defaults to 10)'),
          cursor: z.string().optional().describe('Cursor from previous request for pagination'),
        }),
      },
      output: {
        schema: z.object({
          users: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              avatarURL: z.string().optional(),
              userID: z.string(), // Can be empty string if user has no userID
              isAdmin: z.boolean(),
              created: z.string(),
            })
          ),
          hasNextPage: z.boolean(),
          cursor: z.string().optional(),
        }),
      },
    },

    // Board management actions
    listBoards: {
      title: 'List Boards',
      description: 'List all boards in your Canny workspace',
      input: {
        schema: z.object({
          limit: z.number().optional().describe('Number of boards to fetch'),
          skip: z.number().optional().describe('Number of boards to skip'),
        }),
      },
      output: {
        schema: z.object({
          boards: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              postCount: z.number(),
              url: z.string(),
              created: z.string(),
            })
          ),
          hasMore: z.boolean(),
        }),
      },
    },
  },
})
