import { WebflowClient } from 'src/client'
import * as bp from '../../.botpress'

export const listItems: bp.IntegrationProps['actions']['listItems'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.listItems(
    props.input.collectionID,
    props.input.pagination?.offset ?? 0,
    props.input.pagination?.limit ?? 100,
    props.input.isLiveItems
  )
}

export const getItem: bp.IntegrationProps['actions']['getItem'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.getItem(props.input.collectionID, props.input.itemID, props.input.isLiveItems)
}

export const createItems: bp.IntegrationProps['actions']['createItems'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.createItems(props.input.collectionID, props.input.items, props.input.isLiveItems)
}

export const updateItems: bp.IntegrationProps['actions']['updateItems'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.updateItem(props.input.collectionID, props.input.items, props.input.isLiveItems)
}

export const deleteItems: bp.IntegrationProps['actions']['deleteItems'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.deleteItem(props.input.collectionID, props.input.itemIDs)
}

export const publishItems: bp.IntegrationProps['actions']['publishItems'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.publishItems(props.input.collectionID, props.input.itemIds)
}

export const unpublishLiveItems: bp.IntegrationProps['actions']['unpublishLiveItems'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.unpublishLiveItems(props.input.collectionID, props.input.itemIds)
}
