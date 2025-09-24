import { RuntimeError } from '@botpress/client'
import { handleOutgoingTextMessage } from './channels'
import { FeatureBaseClient } from './feature-base-api/client'
import { handler } from './handler'
import * as bp from '.botpress'

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
    getComments: async (props) => {
      const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
      return await client.getComments(props.input)
    },
  },
  channels: {
    comments: {
      messages: {
        text: handleOutgoingTextMessage,
      },
    },
  },
  handler,
})
