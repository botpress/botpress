import * as sdk from '@botpress/sdk'
import axios from 'axios'

import { WebflowClient } from 'src/client'
import * as bp from '../../.botpress'
import { ItemOutput } from '../types'

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
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[]
  }

  try {
    const response = await axios.post<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? '/live' : ''}?skipInvalidFiles=true`,
      { items: props.input.items },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export const updateItems: bp.IntegrationProps['actions']['updateItems'] = async (props) => {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[]
  }

  try {
    props.logger.debug(props.input.items)
    props.logger.debug(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? '/live' : ''}?skipInvalidFiles=true`
    )
    const response = await axios.patch<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? '/live' : ''}?skipInvalidFiles=true`,
      { items: props.input.items },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export const deleteItems: bp.IntegrationProps['actions']['deleteItems'] = async (props) => {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    await axios.delete(`https://api.webflow.com/v2/collections/${props.input.collectionID}/items`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      data: props.input.itemIDs,
    })
    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export const publishItems: bp.IntegrationProps['actions']['publishItems'] = async (props) => {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    publishedItemIds: string[]
    errors: string[]
  }

  try {
    const response = await axios.post<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items/publish`,
      { itemIds: props.input.itemIds },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export const unpublishLiveItems: bp.IntegrationProps['actions']['unpublishLiveItems'] = async (props) => {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    await axios.post(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items/publish`,
      { itemIds: props.input.itemIds },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}
