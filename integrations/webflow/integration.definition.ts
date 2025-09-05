import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions } from './definitions/actions'

export default new IntegrationDefinition({
  name: 'webflow',
  version: '3.0.0',
  title: 'Webflow',
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
})
