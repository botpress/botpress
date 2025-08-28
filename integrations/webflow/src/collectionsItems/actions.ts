import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { WebflowClient } from 'webflow-api'

export async function listItems(props: bp.ActionProps['listItems']): Promise<bp.actions.listItems.output.Output> {
  // TODO add check for collectionID, add limits and add offset
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const collectionId = props.input.collectionID
  const result = await client.collections.items.listItems(collectionId)

  if (result.pagination == undefined) throw new sdk.RuntimeError('No pagination data found')
  if (result.items == undefined) {
    return { items: [], pagination: result.pagination }
  }
  return { items: result.items, pagination: result.pagination }
}

export async function getItem(props: bp.ActionProps['getItem']): Promise<bp.actions.getItem.output.Output> {
  const apiToken = props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const collectionId = props.input.collectionID
  const result = await client.collections.items.getItem(collectionId, props.input.itemID)

  if (result == undefined) throw new sdk.RuntimeError('Item not found')
  return { itemDetails: result }
}
