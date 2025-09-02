import { z, IntegrationDefinition } from '@botpress/sdk'
import { collections, items } from './definitions/actions'

export default new IntegrationDefinition({
  name: 'webflow',
  version: '0.1.0',
  title: 'Webflow CMS',
  description: 'CRUD operations for Webflow CMS',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiToken: z.string().min(1, 'API Token is required').describe('Your Webflow API Token'),
      siteID: z.string().min(1, 'Site ID is required').describe('The ID of your Webflow site'),
    }),
  },
  actions: {
    listCollections: collections.collectionsActionsDefinitions.listCollections,
    getCollectionDetails: collections.collectionsActionsDefinitions.getCollectionDetails,
    createCollection: collections.collectionsActionsDefinitions.createCollection,
    deleteCollection: collections.collectionsActionsDefinitions.deleteCollection,

    listItems: items.collectionsItemsActionsDefinitions.listItems,
    getItem: items.collectionsItemsActionsDefinitions.getItem,
    createItems: items.collectionsItemsActionsDefinitions.createItems,
    updateItems: items.collectionsItemsActionsDefinitions.updateItems,
    deleteItems: items.collectionsItemsActionsDefinitions.deleteItems,
    publishItems: items.collectionsItemsActionsDefinitions.publishItems,
    unpublishLiveItems: items.collectionsItemsActionsDefinitions.unpublishLiveItems,
  },
})
