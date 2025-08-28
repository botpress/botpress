import { z, IntegrationDefinition } from '@botpress/sdk'
import { collectionsActionsDefinitions } from 'src/collections/definition'
import { collectionsItemsActionsDefinitions } from 'src/collectionsItems/definition'

export default new IntegrationDefinition({
  name: 'webflow-cms',
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
    listCollections: collectionsActionsDefinitions.listCollections,
    getCollectionDetails: collectionsActionsDefinitions.getCollectionDetails,
    createCollection: collectionsActionsDefinitions.createCollection,
    deleteCollection: collectionsActionsDefinitions.deleteCollection,

    listItems: collectionsItemsActionsDefinitions.listItems,
    getItem: collectionsItemsActionsDefinitions.getItem,
    createItem: collectionsItemsActionsDefinitions.createItem,
    updateItems: collectionsItemsActionsDefinitions.updateItems,
    deleteItems: collectionsItemsActionsDefinitions.deleteItems,
  },
})
