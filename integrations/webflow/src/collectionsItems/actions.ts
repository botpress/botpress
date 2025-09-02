import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { ItemOutput, Pagination } from './item'
import axios from 'axios'

export async function listItems(props: bp.ActionProps['listItems']): Promise<bp.actions.listItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[],
    pagination: Pagination
  }

  try {
    const response = await axios.get<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? "/live" : ""}?offset=${props.input.pagination?.offset ?? 0}&limit=${props.input.pagination?.limit ?? 100}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}

export async function getItem(props: bp.ActionProps['getItem']): Promise<bp.actions.getItem.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    const response = await axios.get<ItemOutput>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items/${props.input.itemID}${props.input.isLiveItems ? "/live" : ""}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    return { itemDetails: response.data };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}

export async function createItems(props: bp.ActionProps['createItems']): Promise<bp.actions.createItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[]
  }

  try {
    const response = await axios.post<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? "/live" : ""}?skipInvalidFiles=true`,
      { items: props.input.items },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
      }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}

export async function updateItems(props: bp.ActionProps['updateItems']): Promise<bp.actions.updateItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    items: ItemOutput[]
  }

  try {
    props.logger.debug(props.input.items)
    props.logger.debug(`https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? "/live" : ""}?skipInvalidFiles=true`)
    const response = await axios.patch<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items${props.input.isLiveItems ? "/live" : ""}?skipInvalidFiles=true`,
      { items: props.input.items },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
      }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}

export async function deleteItems(props: bp.ActionProps['deleteItems']): Promise<bp.actions.deleteItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    await axios.delete(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        data: props.input.itemIDs
      }
    );
    return { success: true };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}

export async function publishItems(props: bp.ActionProps['publishItems']): Promise<bp.actions.publishItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    publishedItemIds: string[],
    errors: string[]
  }

  try {
    const response = await axios.post<Result>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items/publish`,
      { itemIds: props.input.itemIds },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
      }
    );

    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}

export async function unpublishLiveItems(props: bp.ActionProps['unpublishLiveItems']): Promise<bp.actions.unpublishLiveItems.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    await axios.post(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}/items/publish`,
      { itemIds: props.input.itemIds },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
      }
    );

    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message;
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err;
  }
}
