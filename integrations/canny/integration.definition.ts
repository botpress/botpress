import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'canny',
  version: '0.2.1',
  title: 'Canny',
  description: 'Connect your Botpress bot to Canny for feature request management and customer feedback collection',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().title('API Key').describe('Your Canny API key'),
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
          authorId: z
            .string()
            .optional()
            .title('Author Id')
            .describe('The author Id (defaults to Botpress user if not provided)'),
          boardId: z.string().title('Board Id').describe('The board Id'),
          title: z.string().title('Post Title').describe('Post title'),
          details: z.string().title('Post Details').describe('Post details'),
          byId: z.string().optional().title('By Id').describe('Admin Id who created the post'),
          categoryId: z.string().optional().title('Category Id').describe('Category Id'),
          ownerId: z.string().optional().title('Owner Id').describe('Owner Id'),
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
          postId: z.string().title('Post Id').describe('The post Id'),
          boardId: z.string().optional().title('Board Id').describe('The board Id'),
        }),
      },
      output: {
        schema: z.object({
          post: z
            .object({
              id: z.string().title('ID').describe('Post ID'),
              title: z.string().title('Title').describe('Post title'),
              details: z.string().optional().title('Details').describe('Post details'),
              authorName: z.string().optional().title('Author Name').describe('Name of the post author'),
              authorEmail: z.string().optional().title('Author Email').describe('Email of the post author'),
              boardName: z.string().title('Board Name').describe('Name of the board'),
              status: z.string().title('Status').describe('Post status'),
              score: z.number().title('Score').describe('Post score'),
              commentCount: z.number().title('Comment Count').describe('Number of comments'),
              created: z.string().title('Created').describe('Creation timestamp'),
              url: z.string().title('URL').describe('Post URL'),
            })
            .title('Post')
            .describe('The retrieved post object'),
        }),
      },
    },
    listPosts: {
      title: 'List Posts',
      description: 'List posts with optional filters',
      input: {
        schema: z.object({
          boardId: z.string().optional().title('Board Id').describe('Filter posts by board Id'),
          authorId: z.string().optional().title('Author Id').describe('Filter posts by author Id'),
          companyId: z.string().optional().title('Company Id').describe('Filter posts by company Id'),
          tagIds: z.array(z.string()).optional().title('Tag Ids').describe('Filter posts by tag Ids'),
          limit: z.number().optional().title('Limit').describe('Number of posts to return'),
          nextToken: z.number().optional().title('Next Token').describe('Token for pagination - skip this many posts'),
          search: z.string().optional().title('Search').describe('Search term to filter posts'),
          sort: z
            .enum(['newest', 'oldest', 'relevance', 'score', 'statusChanged', 'trending'])
            .optional()
            .title('Sort')
            .describe('Sort order for posts'),
          status: z.string().optional().title('Status').describe('Filter posts by status'),
        }),
      },
      output: {
        schema: z.object({
          posts: z
            .array(
              z.object({
                id: z.string().title('ID').describe('Post ID'),
                title: z.string().title('Title').describe('Post title'),
                details: z.string().optional().title('Details').describe('Post details'),
                authorName: z.string().optional().title('Author Name').describe('Name of the post author'),
                authorEmail: z.string().optional().title('Author Email').describe('Email of the post author'),
                boardName: z.string().title('Board Name').describe('Name of the board'),
                status: z.string().title('Status').describe('Post status'),
                score: z.number().title('Score').describe('Post score'),
                commentCount: z.number().title('Comment Count').describe('Number of comments'),
                created: z.string().title('Created').describe('Creation timestamp'),
                url: z.string().title('URL').describe('Post URL'),
              })
            )
            .title('Posts')
            .describe('Array of posts'),
          nextToken: z.number().optional().title('Next Token').describe('Token for next page if more posts available'),
        }),
      },
    },
    updatePost: {
      title: 'Update Post',
      description: 'Update an existing post',
      input: {
        schema: z.object({
          postId: z.string().title('Post Id').describe('The post Id'),
          title: z.string().optional().title('Title').describe('Updated post title'),
          details: z.string().optional().title('Details').describe('Updated post details'),
          eta: z.string().optional().title('ETA').describe('Updated ETA (MM/YYYY)'),
          etaPublic: z.boolean().optional().title('ETA Public').describe('Make ETA public'),
          imageURLs: z.array(z.string()).optional().title('Image URLs').describe('Updated image URLs'),
          customFields: z.record(z.any()).optional().title('Custom Fields').describe('Updated custom fields'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    deletePost: {
      title: 'Delete Post',
      description: 'Delete a post',
      input: {
        schema: z.object({
          postId: z.string().title('Post Id').describe('The post Id to delete'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },

    // Comment actions
    createComment: {
      title: 'Create Comment',
      description: 'Create a new comment on a post',
      input: {
        schema: z.object({
          authorId: z
            .string()
            .optional()
            .title('Author Id')
            .describe('The author Id (defaults to Botpress user if not provided)'),
          postId: z.string().title('Post Id').describe('The post Id'),
          value: z.string().title('Comment Text').describe('Comment text'),
          parentId: z.string().optional().title('Parent Id').describe('Parent comment Id for replies'),
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
          commentId: z.string().title('Comment Id').describe('The comment Id'),
        }),
      },
      output: {
        schema: z.object({
          comment: z
            .object({
              id: z.string().title('ID').describe('Comment ID'),
              value: z.string().title('Value').describe('Comment text'),
              authorName: z.string().title('Author Name').describe('Name of the comment author'),
              authorEmail: z.string().title('Author Email').describe('Email of the comment author'),
              postTitle: z.string().title('Post Title').describe('Title of the associated post'),
              postId: z.string().title('Post ID').describe('ID of the associated post'),
              created: z.string().title('Created').describe('Creation timestamp'),
              internal: z.boolean().title('Internal').describe('Whether this is an internal comment'),
              likeCount: z.number().title('Like Count').describe('Number of likes'),
            })
            .title('Comment')
            .describe('The retrieved comment object'),
        }),
      },
    },
    listComments: {
      title: 'List Comments',
      description: 'List comments with optional filters',
      input: {
        schema: z.object({
          postId: z.string().optional().title('Post Id').describe('Filter comments by post Id'),
          authorId: z.string().optional().title('Author Id').describe('Filter comments by author Id'),
          boardId: z.string().optional().title('Board Id').describe('Filter comments by board Id'),
          companyId: z.string().optional().title('Company Id').describe('Filter comments by company Id'),
          limit: z.number().optional().title('Limit').describe('Number of comments to return'),
          nextToken: z
            .number()
            .optional()
            .title('Next Token')
            .describe('Token for pagination - skip this many comments'),
        }),
      },
      output: {
        schema: z.object({
          comments: z
            .array(
              z.object({
                id: z.string().title('ID').describe('Comment ID'),
                value: z.string().title('Value').describe('Comment text'),
                authorName: z.string().title('Author Name').describe('Name of the comment author'),
                authorEmail: z.string().title('Author Email').describe('Email of the comment author'),
                postTitle: z.string().title('Post Title').describe('Title of the associated post'),
                postId: z.string().title('Post ID').describe('ID of the associated post'),
                created: z.string().title('Created').describe('Creation timestamp'),
                internal: z.boolean().title('Internal').describe('Whether this is an internal comment'),
                likeCount: z.number().title('Like Count').describe('Number of likes'),
              })
            )
            .title('Comments')
            .describe('Array of comments'),
          nextToken: z
            .number()
            .optional()
            .title('Next Token')
            .describe('Token for next page if more comments available'),
        }),
      },
    },
    deleteComment: {
      title: 'Delete Comment',
      description: 'Delete a comment',
      input: {
        schema: z.object({
          commentId: z.string().title('Comment Id').describe('The comment Id to delete'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },

    // User management actions
    createOrUpdateUser: {
      title: 'Create or Update User',
      description: 'Create a new user or update an existing one in Canny',
      input: {
        schema: z.object({
          name: z.string().min(1).max(50).title('Name').describe('User display name (required, 1-50 characters)'),
          userId: z.string().optional().title('User Id').describe('Your internal user Id'),
          email: z.string().optional().title('Email').describe('User email address'),
          avatarURL: z.string().optional().title('Avatar URL').describe('User avatar URL'),
          alias: z.string().optional().title('Alias').describe('User alias'),
          created: z.string().optional().title('Created').describe('User creation timestamp'),
          customFields: z.record(z.any()).optional().title('Custom Fields').describe('Custom fields'),
        }),
      },
      output: {
        schema: z.object({
          user: z
            .object({
              id: z.string().title('ID').describe('User ID'),
              name: z.string().title('Name').describe('User display name'),
              email: z.string().title('Email').describe('User email address'),
              avatarURL: z.string().optional().title('Avatar URL').describe('User avatar URL'),
              userId: z.string().title('User ID').describe('Your internal user ID'),
              isAdmin: z.boolean().title('Is Admin').describe('Whether the user is an admin'),
              created: z.string().title('Created').describe('User creation timestamp'),
            })
            .title('User')
            .describe('The created or updated user object'),
        }),
      },
    },
    listUsers: {
      title: 'List Users',
      description: 'List all users in your Canny workspace with pagination',
      input: {
        schema: z.object({
          limit: z
            .number()
            .min(1)
            .max(100)
            .optional()
            .title('Limit')
            .describe('Number of users to fetch (1-100, defaults to 10)'),
          nextToken: z.string().optional().title('Next Token').describe('Token for pagination from previous request'),
        }),
      },
      output: {
        schema: z.object({
          users: z
            .array(
              z.object({
                id: z.string().title('ID').describe('User ID'),
                name: z.string().title('Name').describe('User display name'),
                email: z.string().title('Email').describe('User email address'),
                avatarURL: z.string().optional().title('Avatar URL').describe('User avatar URL'),
                userId: z.string().title('User ID').describe('Your internal user ID'), // Can be empty string if user has no userId
                isAdmin: z.boolean().title('Is Admin').describe('Whether the user is an admin'),
                created: z.string().title('Created').describe('User creation timestamp'),
              })
            )
            .title('Users')
            .describe('Array of users'),
          nextToken: z.string().optional().title('Next Token').describe('Token for next page if more users available'),
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
          nextToken: z.number().optional().title('Next Token').describe('Token for pagination - skip this many boards'),
        }),
      },
      output: {
        schema: z.object({
          boards: z
            .array(
              z.object({
                id: z.string().title('ID').describe('Board ID'),
                name: z.string().title('Name').describe('Board name'),
                postCount: z.number().title('Post Count').describe('Number of posts in the board'),
                url: z.string().title('URL').describe('Board URL'),
                created: z.string().title('Created').describe('Board creation timestamp'),
              })
            )
            .title('Boards')
            .describe('Array of boards'),
          nextToken: z.number().optional().title('Next Token').describe('Token for next page if more boards available'),
        }),
      },
    },
  },
})
