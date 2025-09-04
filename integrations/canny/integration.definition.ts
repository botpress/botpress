import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  title: 'Canny',
  description: 'Connect your Botpress bot to Canny for feature request management and customer feedback collection',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().title('API Key').describe('Your Canny API key'),
      defaultAuthorID: z
        .string()
        .optional()
        .title('Default Author ID')
        .describe('Default author ID for system messages'),
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
            .title('Author ID')
            .describe('The author ID (defaults to BotpressIntegration user if not provided)'),
          boardID: z.string().title('Board ID').describe('The board ID'),
          title: z.string().title('Post Title').describe('Post title'),
          details: z.string().title('Post Details').describe('Post details'),
          byID: z.string().optional().title('By ID').describe('Admin ID who created the post'),
          categoryID: z.string().optional().title('Category ID').describe('Category ID'),
          ownerID: z.string().optional().title('Owner ID').describe('Owner ID'),
          imageURLs: z.array(z.string()).optional().title('Image URLs').describe('Image URLs'),
          eta: z.string().optional().title('ETA').describe('ETA (MM/YYYY)'),
          etaPublic: z.boolean().optional().title('ETA Public').describe('Make ETA public'),
          customFields: z.record(z.any()).optional().title('Custom Fields').describe('Custom fields'),
        }),
      },
      output: {
        schema: z.object({
          postId: z.string().title('Post ID').describe('The ID of the created post'),
        }),
      },
    },
    getPost: {
      title: 'Get Post',
      description: 'Retrieve a post by ID',
      input: {
        schema: z.object({
          postID: z.string().title('Post ID').describe('The post ID'),
          boardID: z.string().optional().title('Board ID').describe('The board ID'),
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
          }).title('Post').describe('The retrieved post object'),
        }),
      },
    },
    listPosts: {
      title: 'List Posts',
      description: 'List posts with optional filters',
      input: {
        schema: z.object({
          boardID: z.string().optional().title('Board ID').describe('Filter posts by board ID'),
          authorID: z.string().optional().title('Author ID').describe('Filter posts by author ID'),
          companyID: z.string().optional().title('Company ID').describe('Filter posts by company ID'),
          tagIDs: z.array(z.string()).optional().title('Tag IDs').describe('Filter posts by tag IDs'),
          limit: z.number().optional().title('Limit').describe('Number of posts to return'),
          skip: z.number().optional().title('Skip').describe('Number of posts to skip'),
          search: z.string().optional().title('Search').describe('Search term to filter posts'),
          sort: z.enum(['newest', 'oldest', 'relevance', 'score', 'statusChanged', 'trending']).optional().title('Sort').describe('Sort order for posts'),
          status: z.string().optional().title('Status').describe('Filter posts by status'),
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
          ).title('Posts').describe('Array of posts'),
          hasMore: z.boolean().title('Has More').describe('Whether there are more posts available'),
        }),
      },
    },
    updatePost: {
      title: 'Update Post',
      description: 'Update an existing post',
      input: {
        schema: z.object({
          postID: z.string().title('Post ID').describe('The post ID'),
          title: z.string().optional().title('Title').describe('Updated post title'),
          details: z.string().optional().title('Details').describe('Updated post details'),
          eta: z.string().optional().title('ETA').describe('Updated ETA (MM/YYYY)'),
          etaPublic: z.boolean().optional().title('ETA Public').describe('Make ETA public'),
          imageURLs: z.array(z.string()).optional().title('Image URLs').describe('Updated image URLs'),
          customFields: z.record(z.any()).optional().title('Custom Fields').describe('Updated custom fields'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether the update was successful'),
        }),
      },
    },
    deletePost: {
      title: 'Delete Post',
      description: 'Delete a post',
      input: {
        schema: z.object({
          postID: z.string().title('Post ID').describe('The post ID to delete'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether the deletion was successful'),
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
            .title('Author ID')
            .describe('The author ID (defaults to BotpressIntegration user if not provided)'),
          postID: z.string().title('Post ID').describe('The post ID'),
          value: z.string().title('Comment Text').describe('Comment text'),
          parentID: z.string().optional().title('Parent ID').describe('Parent comment ID for replies'),
          imageURLs: z.array(z.string()).optional().title('Image URLs').describe('Image URLs'),
          internal: z.boolean().optional().title('Internal').describe('Whether this is an internal comment'),
          shouldNotifyVoters: z.boolean().optional().title('Notify Voters').describe('Notify voters'),
          createdAt: z.string().optional().title('Created At').describe('Created timestamp'),
        }),
      },
      output: {
        schema: z.object({
          commentId: z.string().title('Comment ID').describe('The ID of the created comment'),
        }),
      },
    },
    getComment: {
      title: 'Get Comment',
      description: 'Retrieve a comment by ID',
      input: {
        schema: z.object({
          commentID: z.string().title('Comment ID').describe('The comment ID'),
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
          }).title('Comment').describe('The retrieved comment object'),
        }),
      },
    },
    listComments: {
      title: 'List Comments',
      description: 'List comments with optional filters',
      input: {
        schema: z.object({
          postID: z.string().optional().title('Post ID').describe('Filter comments by post ID'),
          authorID: z.string().optional().title('Author ID').describe('Filter comments by author ID'),
          boardID: z.string().optional().title('Board ID').describe('Filter comments by board ID'),
          companyID: z.string().optional().title('Company ID').describe('Filter comments by company ID'),
          limit: z.number().optional().title('Limit').describe('Number of comments to return'),
          skip: z.number().optional().title('Skip').describe('Number of comments to skip'),
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
          ).title('Comments').describe('Array of comments'),
          hasMore: z.boolean().title('Has More').describe('Whether there are more comments available'),
        }),
      },
    },
    deleteComment: {
      title: 'Delete Comment',
      description: 'Delete a comment',
      input: {
        schema: z.object({
          commentID: z.string().title('Comment ID').describe('The comment ID to delete'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether the deletion was successful'),
        }),
      },
    },

    // User management actions
    createOrUpdateUser: {
      title: 'Create or Update User',
      description: 'Create a new user or update an existing one in Canny',
      input: {
        schema: z.object({
          name: z.string().min(1).max(50).title('Name').describe('User display name (required, 1-50 characters)'),
          userID: z.string().optional().title('User ID').describe('Your internal user ID'),
          email: z.string().optional().title('Email').describe('User email address'),
          avatarURL: z.string().optional().title('Avatar URL').describe('User avatar URL'),
          alias: z.string().optional().title('Alias').describe('User alias'),
          created: z.string().optional().title('Created').describe('User creation timestamp'),
          customFields: z.record(z.any()).optional().title('Custom Fields').describe('Custom fields'),
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
          }).title('User').describe('The created or updated user object'),
        }),
      },
    },
    listUsers: {
      title: 'List Users',
      description: 'List all users in your Canny workspace with pagination',
      input: {
        schema: z.object({
          limit: z.number().min(1).max(100).optional().title('Limit').describe('Number of users to fetch (1-100, defaults to 10)'),
          cursor: z.string().optional().title('Cursor').describe('Cursor from previous request for pagination'),
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
          ).title('Users').describe('Array of users'),
          hasNextPage: z.boolean().title('Has Next Page').describe('Whether there are more users available'),
          cursor: z.string().optional().title('Cursor').describe('Cursor for next page'),
        }),
      },
    },

    // Board management actions
    listBoards: {
      title: 'List Boards',
      description: 'List all boards in your Canny workspace',
      input: {
        schema: z.object({
          limit: z.number().optional().title('Limit').describe('Number of boards to fetch'),
          skip: z.number().optional().title('Skip').describe('Number of boards to skip'),
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
          ).title('Boards').describe('Array of boards'),
          hasMore: z.boolean().title('Has More').describe('Whether there are more boards available'),
        }),
      },
    },
  },
})
