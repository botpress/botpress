import { z, IntegrationDefinition } from '@botpress/sdk'
import { listBoards, getBoard, listPosts, createPost, deletePost, updatePost, getComments } from 'definitions/actions'
import { comments } from 'definitions/channels'
import { postCreated, postUpdated, postDeleted, postVoted } from 'definitions/events'

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
    comments,
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
