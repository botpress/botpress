import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions } from './definitions/actions'

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
    listCollections: actions.listCollections,
    getCollectionDetails: actions.getCollectionDetails,
    createCollection: actions.createCollection,
    deleteCollection: actions.deleteCollection,

    listItems: actions.listItems,
    getItem: actions.getItem,
    createItems: actions.createItems,
    updateItems: actions.updateItems,
    deleteItems: actions.deleteItems,
    publishItems: actions.publishItems,
    unpublishLiveItems: actions.unpublishLiveItems,
  },
  events: {
    collectionItemCreated: {
      title: 'Collection Item Created',
      description: 'Information about a new collection item',
      schema: z.object({
        triggerType: z.string(),
        payload: z.object({
          id: z.string(),
          workspaceId: z.string(),
          siteId: z.string(),
          collectionId: z.string(),
          fieldData: z.object({
            name: z.string(),
            slug: z.string(),
          }),
          lastPublished: z.string(),
          lastUpdated: z.string(),
          createdOn: z.string(),
          isArchived: z.boolean(),
          isDraft: z.boolean(),
        }),
      }),
    },
  },
})
