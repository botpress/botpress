import * as bp from '../.botpress'
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
