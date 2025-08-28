import * as bp from '.botpress'
import { createCollection, deleteCollection, getCollectionDetails, listCollections } from './collections/actions'
import { getItem, listItems, createItem, updateItems, deleteItems } from './collectionsItems/actions'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    listCollections: listCollections,
    getCollectionDetails: getCollectionDetails,
    createCollection: createCollection,
    deleteCollection: deleteCollection,

    listItems: listItems,
    getItem: getItem,
    createItem: createItem,
    updateItems: updateItems,
    deleteItems: deleteItems,
  },
  channels: {},
  handler: async () => {},
})
