import { createCollection, deleteCollection, getCollectionDetails, listCollections } from './collections/actions'
import {
  getItem,
  listItems,
  createItems,
  updateItems,
  deleteItems,
  publishItems,
  unpublishLiveItems,
} from './collectionsItems/actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    listCollections,
    getCollectionDetails,
    createCollection,
    deleteCollection,

    listItems,
    getItem,
    createItems,
    updateItems,
    deleteItems,
    publishItems,
    unpublishLiveItems,
  },
  channels: {},
  handler: async () => {},
})
