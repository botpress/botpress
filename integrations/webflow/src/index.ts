import * as bp from '../.botpress'
import { WebflowClient } from './client'

export default new bp.Integration({
  register: async () => { },
  unregister: async () => { },
  actions: {
    async listCollections(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.listCollections(props.ctx.configuration.siteID)
    },

    async getCollectionDetails(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.getCollectionDetails(props.input.collectionID)
    },

    async createCollection(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.createCollection(props.ctx.configuration.siteID, props.input.collectionInfo)
    },

    async deleteCollection(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.deleteCollection(props.input.collectionID)
    },

    async listItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.listItems(
        props.input.collectionID,
        props.input.pagination?.offset ?? 0,
        props.input.pagination?.limit ?? 100,
        props.input.isLiveItems
      )
    },

    async getItem(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.getItem(props.input.collectionID, props.input.itemID, props.input.isLiveItems)
    },

    async createItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.createItems(props.input.collectionID, props.input.items, props.input.isLiveItems)
    },

    async updateItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.updateItem(props.input.collectionID, props.input.items, props.input.isLiveItems)
    },

    async deleteItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.deleteItem(props.input.collectionID, props.input.itemIDs)
    },

    async publishItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.publishItems(props.input.collectionID, props.input.itemIds)
    },

    async unpublishLiveItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.unpublishLiveItems(props.input.collectionID, props.input.itemIds)
    },
  },
  channels: {},
  handler: async () => { },
})
