import { z, IntegrationDefinition } from '@botpress/sdk'
import { collectionsActionsDefinitions } from 'src/collections/definition'

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
      siteId: z.string().min(1, 'Site ID is required').describe('The ID of your Webflow site'),
    }),
  },
  actions: {
    listCollections: collectionsActionsDefinitions.listCollections,
    getCollectionDetails: collectionsActionsDefinitions.getCollectionDetails,
    createCollection: collectionsActionsDefinitions.createCollection,
    deleteCollection: collectionsActionsDefinitions.deleteCollection,
    listItems: {
      title: 'List Items',
      input: {
        schema: z.object({
          collectionId: z.string().min(1, 'Collection ID is required').describe('The ID of the Webflow collection'),
          limit: z.number().min(1).max(100).optional().describe('Number of items to retrieve (max 100)'),
          offset: z.number().min(0).optional().describe('Number of items to skip'),
        }),
      },
      output: {
        schema: z.object({
          items: z.array(z.any()).describe('Array of items from the collection'),
        }),
      },
    },
    getItem: {
      title: 'Get Item',
      input: {
        schema: z.object({
          collectionId: z.string().min(1, 'Collection ID is required').describe(' The ID of the Webflow collection'),
          itemId: z.string().min(1, 'Item ID is required').describe('The ID of the item to retrieve'),
        }),
      },
      output: {
        schema: z.object({
          item: z.any().describe('The retrieved item from the collection'),
        }),
      },
    },
  },
})
