import { RuntimeError } from '@botpress/client'
import { z } from '@botpress/sdk'
import { postUpdated, postCreated, postDeleted, postVoted } from 'definitions/events/posts'
import { FeatureBaseClient } from './client'
import * as bp from '.botpress'

const webhookRequestSchema = z.union([postCreated.schema, postUpdated.schema, postDeleted.schema, postVoted.schema])

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
  channels: {},
  handler: async (props) => {
    if (!props.req.body) {
      props.logger.error('Handler received an empty body')
      return
    }

    let json: unknown | null = null
    try {
      json = JSON.parse(props.req.body)
    } catch {
      props.logger.error('Failed to parse request body as JSON')
      return
    }

    const parseResult = webhookRequestSchema.safeParse(json)
    if (!parseResult.success) {
      props.logger.error(`Failed to validate request body: ${parseResult.error.message}`)
      return
    }

    const { data: webhookRequestPayload } = parseResult

    switch (webhookRequestPayload.topic) {
      case 'post.created': {
        props.client.createEvent({ type: 'postCreated', payload: webhookRequestPayload })
        break
      }
      case 'post.updated': {
        props.client.createEvent({ type: 'postUpdated', payload: webhookRequestPayload })
        break
      }
      case 'post.deleted': {
        props.client.createEvent({ type: 'postDeleted', payload: webhookRequestPayload })
        break
      }
      case 'post.voted': {
        props.client.createEvent({ type: 'postVoted', payload: webhookRequestPayload })
        break
      }
      default:
        break
    }
  },
})
