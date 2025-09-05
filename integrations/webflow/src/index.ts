import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { commentSchema, formSchema, itemSchema, pageSchema, siteSchema, WebflowEvent } from 'definitions/events'
import * as bp from '../.botpress'
import { WebflowClient } from './client'

export default new bp.Integration({
  register: async (props) => {
    const client = new WebflowClient(props.ctx.configuration.apiToken)
    await client.listCollections(props.ctx.configuration.siteID).catch(_handleError('Failed to register integration'))
  },
  unregister: async () => { },
  actions: {
    async listCollections(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .listCollections(props.ctx.configuration.siteID)
        .catch(_handleError('Failed to list collections'))
    },

    async getCollectionDetails(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .getCollectionDetails(props.input.collectionID)
        .catch(_handleError('Failed to get collection details'))
    },

    async createCollection(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .createCollection(props.ctx.configuration.siteID, props.input.collectionInfo)
        .catch(_handleError('Failed to create collection'))
    },

    async deleteCollection(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client.deleteCollection(props.input.collectionID).catch(_handleError('Failed to delete collection'))
    },

    async listItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .listItems(props.input.collectionID, props.input.pagination?.offset ?? 0, props.input.pagination?.limit ?? 100)
        .catch(_handleError('Failed to list items'))
    },

    async getItem(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .getItem(props.input.collectionID, props.input.itemID, props.input.isLiveItems)
        .catch(_handleError('Failed to get item'))
    },

    async createItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .createItems(props.input.collectionID, props.input.items, props.input.isLiveItems)
        .catch(_handleError('Failed to create items'))
    },

    async updateItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .updateItem(props.input.collectionID, props.input.items, props.input.isLiveItems)
        .catch(_handleError('Failed to update items'))
    },

    async deleteItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .deleteItem(props.input.collectionID, props.input.itemIDs)
        .catch(_handleError('Failed to delete items'))
    },

    async publishItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .publishItems(props.input.collectionID, props.input.itemIds)
        .catch(_handleError('Failed to publish items'))
    },

    async unpublishLiveItems(props) {
      const client = new WebflowClient(props.ctx.configuration.apiToken)
      return await client
        .unpublishLiveItems(props.input.collectionID, props.input.itemIds)
        .catch(_handleError('Failed to unpublish live items'))
    },
  },
  channels: {},
  handler: async (props) => {
    type triggerType = 'collection_item_created'
    if (!props.req.body) {
      props.logger.warn('Handler received an empty body')
      return
    }

    const data: WebflowEvent = JSON.parse(props.req.body)
    const snakeCase2CamelCase = (str: string) => str.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    const triggerType = snakeCase2CamelCase(data.triggerType)

    // TODO remove before pushing to prod
    props.logger.debug(data)

    switch (triggerType) {
      case 'formSubmission':
        await props.client
          .createEvent({
            type: triggerType,
            payload: formSchema.parse(data.payload),
          })
          .catch(_handleError(`Failed to create ${triggerType} event`))
        break

      case 'sitePublish':
        await props.client
          .createEvent({
            type: triggerType,
            payload: siteSchema.parse(data.payload),
          })
          .catch(_handleError(`Failed to create ${triggerType} event`))
        break

      case 'pageCreated':
      case 'pageMetadataUpdated':
      case 'pageDeleted':
        await props.client
          .createEvent({
            type: triggerType,
            payload: pageSchema.parse(data.payload),
          })
          .catch(_handleError(`Failed to create ${triggerType} event`))
        break

      case 'collectionItemCreated':
      case 'collectionItemDeleted':
      case 'collectionItemPublished':
      case 'collectionItemUnpublished':
        await props.client
          .createEvent({
            type: triggerType,
            payload: itemSchema.parse(data.payload),
          })
          .catch(_handleError(`Failed to create ${triggerType} event`))
        break

      case 'collectionItemChanged':
        await props.client
          .createEvent({
            type: 'collectionItemUpdated',
            payload: itemSchema.parse(data.payload),
          })
          .catch(_handleError(`Failed to create ${triggerType} event`))
        break

      case 'commentCreated':
        await props.client
          .createEvent({
            type: triggerType,
            payload: commentSchema.parse(data.payload),
          })
          .catch(_handleError(`Failed to create ${triggerType} event`))
        break

      default:
        props.logger.info(`event ${triggerType} not supported`)
        break
    }
  },
})

const _handleError = (outterMessage: string) => (thrown: unknown) => {
  let innerMessage: string | undefined = undefined
  if (axios.isAxiosError(thrown)) {
    innerMessage = thrown.response?.data?.message || thrown.message
  } else {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    innerMessage = err.message
  }

  const fullMessage = innerMessage ? `${outterMessage}: ${innerMessage}` : outterMessage
  throw new sdk.RuntimeError(fullMessage)
}
