import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { commentSchema, formSchema, itemSchema, pageSchema, siteSchema } from 'definitions/sub-schemas'
import * as bp from '../.botpress'
import { WebflowClient } from './client'
import { safeJsonParse } from './utils'

const webhookRequestSchema = sdk.z.union([
  sdk.z.object({ triggerType: sdk.z.literal('form_submission'), payload: formSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('site_publish'), payload: siteSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('page_created'), payload: pageSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('page_metadata_updated'), payload: pageSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('page_deleted'), payload: pageSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('collection_item_created'), payload: itemSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('collection_item_deleted'), payload: itemSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('collection_item_changed'), payload: itemSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('collection_item_published'), payload: itemSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('collection_item_unpublished'), payload: itemSchema }),
  sdk.z.object({ triggerType: sdk.z.literal('comment_created'), payload: commentSchema }),
])

const fireEvent = async <T extends keyof bp.events.Events>(
  props: bp.HandlerProps,
  type: T,
  payload: bp.events.Events[T]
) => {
  await props.client
    .createEvent({ type: type as Extract<T, string>, payload })
    .catch(_handleError(`Failed to create ${type} event`))
}

export default new bp.Integration({
  register: async (props) => {
    const client = new WebflowClient(props.ctx.configuration.apiToken)
    const triggerTypesToHook = [
      'form_submission',
      'site_publish',
      'page_created',
      'page_metadata_updated',
      'page_deleted',
      'collection_item_created',
      'collection_item_changed',
      'collection_item_deleted',
      'collection_item_published',
      'collection_item_unpublished',
      'comment_created',
    ]

    const already = await client
      .listWebhooks(props.ctx.configuration.siteID)
      .catch(_handleError('Failed to list webhooks'))

    const existing = new Set(already.map((w: { triggerType: string }) => w.triggerType))
    const missing = triggerTypesToHook.filter((t) => !existing.has(t))
    await Promise.all(
      missing.map((triggerType) =>
        client
          .createWebhook(triggerType, props.ctx.configuration.siteID, props.webhookUrl)
          .catch(_handleError('Failed to create webhooks'))
      )
    )
  },
  unregister: async (props) => {
    const client = new WebflowClient(props.ctx.configuration.apiToken)

    const webhooks = await client
      .listWebhooks(props.ctx.configuration.siteID)
      .catch(_handleError('Failed to create webhooks'))

    const webhookIDs = webhooks.map((w: { id: string }) => w.id)
    await Promise.all(
      webhookIDs.map((webhookID) => client.deleteWebhooks(webhookID).catch(_handleError('Failed to delete webhook')))
    )
  },
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
    if (!props.req.body) {
      props.logger.error('Handler received an empty body')
      return
    }

    const jsonParseResult = safeJsonParse(props.req.body)
    if (!jsonParseResult.success) {
      props.logger.error(`Failed to parse request body: ${jsonParseResult.err.message}`)
      return
    }

    const zodParseResult = webhookRequestSchema.safeParse(jsonParseResult.data)
    if (!zodParseResult.success) {
      props.logger.error(`Failed to validate request body: ${zodParseResult.error.message}`)
      return
    }

    const { data } = zodParseResult

    switch (data.triggerType) {
      case 'form_submission':
        await fireEvent(props, 'formSubmission', data.payload)
        break
      case 'site_publish':
        await fireEvent(props, 'sitePublish', data.payload)
        break
      case 'page_created':
        await fireEvent(props, 'pageCreated', data.payload)
        break
      case 'page_metadata_updated':
        await fireEvent(props, 'pageMetadataUpdated', data.payload)
        break
      case 'page_deleted':
        await fireEvent(props, 'pageDeleted', data.payload)
        break
      case 'collection_item_created':
        await fireEvent(props, 'collectionItemCreated', data.payload)
        break
      case 'collection_item_deleted':
        await fireEvent(props, 'collectionItemDeleted', data.payload)
        break
      case 'collection_item_published':
        await fireEvent(props, 'collectionItemPublished', data.payload)
        break
      case 'collection_item_unpublished':
        await fireEvent(props, 'collectionItemUnpublished', data.payload)
        break
      case 'collection_item_changed':
        await fireEvent(props, 'collectionItemUpdated', data.payload)
        break
      case 'comment_created':
        await fireEvent(props, 'commentCreated', data.payload)
        break
      default:
        data satisfies never
        props.logger.info(`event ${(data as any).triggerType} not supported`)
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
