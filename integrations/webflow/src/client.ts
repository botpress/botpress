import * as sdk from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import * as bp from '.botpress'

export class WebflowClient {
  private _axiosClient: AxiosInstance

  public constructor(token: string) {
    this._axiosClient = axios.create({
      baseURL: 'https://api.webflow.com/v2',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  public listItems = async (
    collectionID: string,
    offset: number,
    limit: number,
    isLiveItems?: boolean
  ): Promise<bp.actions.listItems.output.Output> => {
    const path = `/collections/${collectionID}/items${isLiveItems ? '/live' : ''}?offset=${offset}&limit=${limit}`
    const resp = await this._axiosClient.get<bp.actions.listItems.output.Output>(path)
    try {
      return resp.data
    } catch {
      throw new sdk.RuntimeError('Failed to list items due to unexpected api response')
    }
  }

  public getItem = async (
    collectionID: string,
    itemID: string,
    isLiveItems?: boolean
  ): Promise<bp.actions.getItem.output.Output> => {
    const path = `/collections/${collectionID}/items/${itemID}${isLiveItems ? '/live' : ''}`
    const resp = await this._axiosClient.get(path)
    try {
      return { itemDetails: resp.data }
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public createItems = async (
    collectionID: string,
    items: object,
    isLiveItems?: boolean
  ): Promise<bp.actions.createItems.output.Output> => {
    const path = `/collections/${collectionID}/items${isLiveItems ? '/live' : ''}?skipInvalidFiles=true`
    const resp = await this._axiosClient.post(path, { items })
    try {
      return resp.data
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public updateItem = async (
    collectionID: string,
    items: object,
    isLiveItems?: boolean
  ): Promise<bp.actions.updateItems.output.Output> => {
    const path = `/collections/${collectionID}/items${isLiveItems ? '/live' : ''}?skipInvalidFiles=true`
    const resp = await this._axiosClient.patch(path, { items })
    try {
      return resp.data
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public deleteItem = async (collectionID: string, itemIds: object): Promise<bp.actions.deleteItems.output.Output> => {
    const path = `/collections/${collectionID}/items`
    await this._axiosClient.delete(path, { data: itemIds })
    try {
      return { success: true }
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public publishItems = async (
    collectionID: string,
    itemIds: object
  ): Promise<bp.actions.publishItems.output.Output> => {
    const path = `/collections/${collectionID}/items/publish`
    const resp = await this._axiosClient.post(path, { itemIds })
    try {
      return resp.data
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public unpublishLiveItems = async (
    collectionID: string,
    itemIds: object
  ): Promise<bp.actions.unpublishLiveItems.output.Output> => {
    const path = `https://api.webflow.com/v2/collections/${collectionID}/items/publish`
    await this._axiosClient.post(path, { items: itemIds })
    try {
      return { success: true }
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public listCollections = async (siteID: string): Promise<bp.actions.listCollections.output.Output> => {
    const path = `/sites/${siteID}/collections`
    const resp = await this._axiosClient.get(path)
    try {
      return resp.data
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public getCollectionDetails = async (
    collectionID: string
  ): Promise<bp.actions.getCollectionDetails.output.Output> => {
    const path = `/collections/${collectionID}`
    const resp = await this._axiosClient.get(path)
    try {
      return { collectionDetails: resp.data }
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public createCollection = async (
    siteID: string,
    collectionInfo: object
  ): Promise<bp.actions.createCollection.output.Output> => {
    const path = `/sites/${siteID}/collections`
    const resp = await this._axiosClient.post(path, collectionInfo)
    try {
      return { collectionDetails: resp.data }
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }

  public deleteCollection = async (collectionID: string): Promise<bp.actions.deleteCollection.output.Output> => {
    const path = `/collections/${collectionID}`
    await this._axiosClient.delete(path)
    try {
      return { success: true }
    } catch {
      throw new sdk.RuntimeError('Failed to get item due to unexpected api response')
    }
  }
}
