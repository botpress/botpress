import { RuntimeError } from '@botpress/client'
import { postUpdated, postCreated, postDeleted, postVoted } from 'definitions/events/posts'
import { FeatureBaseClient } from './client'
import * as bp from '.botpress'
import { handleTextMessage } from './channels'

export default new bp.Integration({
  register: async (props) => {
    const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
    try {
      await client.listBoards()
    } catch {
      throw new RuntimeError('Failed to register the integration.')
    }
  },
  unregister: async () => {},
  actions: {
    listPosts: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      const posts = await client.listPosts(props.input)
      return posts
    },
    createPost: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      return await client.createPost(props.input)
    },
    updatePost: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      return await client.updatePost(props.input)
    },
    deletePost: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      return await client.deletePost(props.input)
    },
    listBoards: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      return await client.listBoards()
    },
    getBoard: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      return await client.getBoard(props.input)
    },
  },
  channels: {
    comments: {
      messages: {
        text: handleTextMessage,
      },
    },
  },
  handler: async (props) => {
    if (!props.req.body) {
      props.logger.error('Handler received an empty body')
      return
    }

    let json: any | null = null
    try {
      json = JSON.parse(props.req.body)
    } catch {
      props.logger.error('Failed to parse request body as JSON')
      return
    }

    if (!json?.topic) {
      props.logger.error('Failed to find event topic')
      return
    }

    switch (json.topic) {
      case 'post.created': {
        const result = postCreated.schema.safeParse(json)
        if (!result.success) {
          props.logger.error(`Failed to validate request body: ${result.error.message}`)
          return
        }
        props.client.createEvent({ type: 'postCreated', payload: result.data })
        break
      }
      case 'post.updated': {
        const result = postUpdated.schema.safeParse(json)
        if (!result.success) {
          props.logger.error(`Failed to validate request body: ${result.error.message}`)
          return
        }
        props.client.createEvent({ type: 'postUpdated', payload: result.data })
        break
      }
      case 'post.deleted': {
        const result = postDeleted.schema.safeParse(json)
        if (!result.success) {
          props.logger.error(`Failed to validate request body: ${result.error.message}`)
          return
        }
        props.client.createEvent({ type: 'postDeleted', payload: result.data })
        break
      }
      case 'post.voted': {
        const result = postVoted.schema.safeParse(json)
        if (!result.success) {
          props.logger.error(`Failed to validate request body: ${result.error.message}`)
          return
        }
        props.client.createEvent({ type: 'postVoted', payload: result.data })
        break
      }
      default:
        break
    }
  },
})
