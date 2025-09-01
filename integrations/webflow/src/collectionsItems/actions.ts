import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { WebflowClient } from 'webflow-api'
import { CreateBulkCollectionItemRequestBody, ItemsUpdateItemsResponse, MultipleItems } from 'webflow-api/api/resources/collections'
import { BulkCollectionItem, CollectionItem, CollectionItemList } from 'webflow-api/api'
import { ItemsCreateItemRequest } from 'webflow-api/wrapper/schemas'
import { error } from 'console'

export async function listItems(props: bp.ActionProps['listItems']): Promise<bp.actions.listItems.output.Output> {
  // TODO add check for collectionID, add limits and add offset
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const result = await client.collections.items.listItems(props.input.collectionID)

  if (result.pagination == undefined) throw new sdk.RuntimeError('No pagination data found')
  if (result.items == undefined) {
    return { items: [], pagination: result.pagination }
  }
  return { items: result.items, pagination: result.pagination }
}

export async function getItem(props: bp.ActionProps['getItem']): Promise<bp.actions.getItem.output.Output> {
  const apiToken = props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const result: CollectionItem = await client.collections.items.getItem(props.input.collectionID, props.input.itemID)

  if (result == undefined) throw new sdk.RuntimeError('Item not found')
  return { itemDetails: result }
}

export async function createItem(props: bp.ActionProps['createItem']): Promise<bp.actions.createItem.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const result = await client.collections.items.createItems(props.input.collectionID, props.input.items)

  props.logger.forBot().debug(result.items)
  if (result == undefined) throw new sdk.RuntimeError('Failed to update item')
  return { items: (result as CollectionItemList).items! }
}

export async function updateItems(props: bp.ActionProps['updateItems']): Promise<bp.actions.updateItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const test = props.input.items.items.map((item, index) => {
    if (props.input.itemsID[index] == undefined) throw new sdk.RuntimeError('No item IDs provided')
    return {
      ...item,
      id: props.input.itemsID[index],
    }
  })

  const result = await client.collections.items.updateItems(props.input.collectionID, { items: test })

  if (result == undefined) throw new sdk.RuntimeError('Failed to update item')
  if ((result as CollectionItemList).items == undefined) return { items: [result as CollectionItem] }
  return { items: (result as CollectionItemList).items! }
}

export async function deleteItems(props: bp.ActionProps['deleteItems']): Promise<bp.actions.deleteItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const result = await client.collections.items.deleteItems(props.input.collectionID, props.input.itemIDs)

  if (result == undefined) throw new sdk.RuntimeError('Failed to delete item')
  return { success: true }
}
