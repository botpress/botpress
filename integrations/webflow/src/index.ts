import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { WebflowClient } from 'webflow-api'
import { CollectionItem } from 'webflow-api/api';
import { createCollection, deleteCollection, getCollectionDetails, listCollections } from './collections/actions';



export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    listCollections: listCollections,
    getCollectionDetails: getCollectionDetails,
    createCollection: createCollection,
    deleteCollection: deleteCollection,
    listItems: async function (props: bp.ActionProps["listItems"]): Promise<bp.actions.listItems.output.Output> {
      // TODO add check for collectionID, add limits and add offset
      const apiToken = props.ctx.configuration.apiToken;
      const client = new WebflowClient({ accessToken: apiToken });

      const collectionId = props.input.collectionId;
      const result = await client.collections.items.listItems(collectionId);

      if (result.items == undefined) throw new sdk.RuntimeError('No items found in the collection');
      return { items: result.items! };
    },

    getItem: async function (props: bp.ActionProps["getItem"]): Promise<bp.actions.getItem.output.Output> {
      const apiToken = props.ctx.configuration.apiToken;
      const client = new WebflowClient({ accessToken: apiToken });

      const collectionId = props.input.collectionId;
      const result: CollectionItem = await client.collections.items.getItem(collectionId, props.input.itemId);

      if (result == undefined) throw new sdk.RuntimeError('Item not found');
      return { item: result }
    },
  },
  channels: {},
  handler: async () => {},
})
