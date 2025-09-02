import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { ItemOutput, Pagination } from './item'

export async function listItems(props: bp.ActionProps['listItems']): Promise<bp.actions.listItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[],
    pagination: Pagination
  }

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${props.input.collectionID}/items?offset=${props.input.pagination?.offset ?? 0}&limit=${props.input.pagination?.limit ?? 100}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`
      },
    }
  )

  if (!response.ok) throw new sdk.RuntimeError("siteID or apiToken not valid")

  return await response.json() as Result
}

export async function getItem(props: bp.ActionProps['getItem']): Promise<bp.actions.getItem.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${props.input.collectionID}/items/${props.input.itemID}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`
      },
    }
  )

  if (!response.ok) throw new sdk.RuntimeError("siteID or apiToken not valid")

  const result = await response.json() as ItemOutput

  if (result == undefined) throw new sdk.RuntimeError('Item not found')
  return { itemDetails: result }
}

export async function createItems(props: bp.ActionProps['createItems']): Promise<bp.actions.createItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[]
  }

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${props.input.collectionID}/items?skipInvalidFiles=true`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items: props.input.items })
    }
  )

  if (!response.ok) throw new sdk.RuntimeError("siteID or apiToken not valid")

  return await response.json() as Result
}

export async function updateItems(props: bp.ActionProps['updateItems']): Promise<bp.actions.updateItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[]
  }

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${props.input.collectionID}/items?skipInvalidFiles=true`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(props.input.items)
    }
  )

  if (!response.ok) throw new sdk.RuntimeError("siteID or apiToken not valid")

  const result = await response.json() as Result


  if (result == undefined) throw new sdk.RuntimeError('Failed to update item')
  return result
}

export async function deleteItems(props: bp.ActionProps['deleteItems']): Promise<bp.actions.deleteItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${props.input.collectionID}/items`,
    {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(props.input.itemIDs)
    }
  )
  if (!response.ok) throw new sdk.RuntimeError("items id invalid or collection id invalid")
  return { success: true }
}

