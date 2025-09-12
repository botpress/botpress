import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { listBoards, getBoard } from 'definitions/actions/boards'
import { getComments } from 'definitions/actions/comments'
import { listPosts, createPost, deletePost, updatePost } from 'definitions/actions/posts'
import { postCreated, postUpdated, postDeleted, postVoted } from 'definitions/events/posts'

export default new IntegrationDefinition({
  name: 'feature-base',
  version: '0.3.0',
  title: 'Feature Base',
  description: 'CRUD operations for Feature Base',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1, 'API Key is required').describe('Your Feature Base API Key').title('API Key'),
    }),
  },
  actions: {
    listBoards,
    getBoard,
    createPost,
    listPosts,
    deletePost,
    updatePost,
    getComments,
  },
  events: {
    postCreated,
    postUpdated,
    postDeleted,
    postVoted,
  },
  channels: {
    comments: {
      title: 'Comments',
      description: 'Comment section of a post',
      messages: {
        text: messages.defaults.text,
      },
      message: {
        tags: {
          id: {
            title: 'ID',
            description: 'The Feature Base ID of the comment',
          },
        },
      },
      conversation: {
        tags: {
          rootCommentId: {
            title: 'Root Comment ID',
            description: 'The Feature Base ID of the root comment of the reply chain',
          },
          submissionId: {
            title: 'Submission ID',
            description: 'The Feature Base ID of the submission (post) where the comment was posted',
          },
        },
      },
    },
  },
  user: {
    tags: {
      id: {
        title: 'ID',
        description: 'The Feature Base ID of the user',
      },
    },
  },
})
