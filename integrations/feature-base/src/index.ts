import { RuntimeError } from '@botpress/client'
import { FeatureBaseClient } from './client'
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
      return await client.listPosts(props.input)
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
  handler: async () => {},
})
