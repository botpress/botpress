import * as bp from '../.botpress'
import { WebflowClient } from './client'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    async listCollections(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.listCollections(props.ctx.configuration.siteID)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async getCollectionDetails(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.getCollectionDetails(props.input.collectionID)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async createCollection(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.createCollection(props.ctx.configuration.siteID, props.input.collectionInfo)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async deleteCollection(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.deleteCollection(props.input.collectionID)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async listItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.listItems(
          props.input.collectionID,
          props.input.pagination?.offset ?? 0,
          props.input.pagination?.limit ?? 100,
          props.input.isLiveItems
        )
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async getItem(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.getItem(props.input.collectionID, props.input.itemID, props.input.isLiveItems)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async createItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.createItems(props.input.collectionID, props.input.items, props.input.isLiveItems)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async updateItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.updateItem(props.input.collectionID, props.input.items, props.input.isLiveItems)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async deleteItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.deleteItem(props.input.collectionID, props.input.itemIDs)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async publishItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.publishItems(props.input.collectionID, props.input.itemIds)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },

    async unpublishLiveItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      try {
        return await client.unpublishLiveItems(props.input.collectionID, props.input.itemIds)
      } catch (thrown) {
        throw thrown instanceof Error ? thrown : new Error(String(thrown))
      }
    },
  },
  channels: {},
  handler: async () => {},
})
