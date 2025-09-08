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
    return resp.data
  }

  public getItem = async (
    collectionID: string,
    itemID: string,
    isLiveItems?: boolean
  ): Promise<bp.actions.getItem.output.Output> => {
    const path = `/collections/${collectionID}/items/${itemID}${isLiveItems ? '/live' : ''}`
    const resp = await this._axiosClient.get(path)
    return { itemDetails: resp.data }
  }

  public createItems = async (
    collectionID: string,
    items: object,
    isLiveItems?: boolean
  ): Promise<bp.actions.createItems.output.Output> => {
    const path = `/collections/${collectionID}/items${isLiveItems ? '/live' : ''}?skipInvalidFiles=true`
    const resp = await this._axiosClient.post(path, { items })
    return resp.data
  }

  public updateItem = async (
    collectionID: string,
    items: object,
    isLiveItems?: boolean
  ): Promise<bp.actions.updateItems.output.Output> => {
    const path = `/collections/${collectionID}/items${isLiveItems ? '/live' : ''}?skipInvalidFiles=true`
    const resp = await this._axiosClient.patch(path, { items })
    return resp.data
  }

  public deleteItem = async (collectionID: string, itemIds: object): Promise<bp.actions.deleteItems.output.Output> => {
    const path = `/collections/${collectionID}/items`
    await this._axiosClient.delete(path, { data: itemIds })
    return {}
  }

  public publishItems = async (
    collectionID: string,
    itemIds: object
  ): Promise<bp.actions.publishItems.output.Output> => {
    const path = `/collections/${collectionID}/items/publish`
    const resp = await this._axiosClient.post(path, { itemIds })
    return resp.data
  }

  public unpublishLiveItems = async (
    collectionID: string,
    itemIds: object
  ): Promise<bp.actions.unpublishLiveItems.output.Output> => {
    const path = `https://api.webflow.com/v2/collections/${collectionID}/items/publish`
    await this._axiosClient.post(path, { items: itemIds })
    return {}
  }

  public listCollections = async (siteID: string): Promise<bp.actions.listCollections.output.Output> => {
    const path = `/sites/${siteID}/collections`
    const resp = await this._axiosClient.get(path)
    return resp.data
  }

  public getCollectionDetails = async (
    collectionID: string
  ): Promise<bp.actions.getCollectionDetails.output.Output> => {
    const path = `/collections/${collectionID}`
    const resp = await this._axiosClient.get(path)
    return { collectionDetails: resp.data }
  }

  public createCollection = async (
    siteID: string,
    collectionInfo: object
  ): Promise<bp.actions.createCollection.output.Output> => {
    const path = `/sites/${siteID}/collections`
    const resp = await this._axiosClient.post(path, collectionInfo)
    return { collectionDetails: resp.data }
  }

  public deleteCollection = async (collectionID: string): Promise<bp.actions.deleteCollection.output.Output> => {
    const path = `/collections/${collectionID}`
    await this._axiosClient.delete(path)
    return {}
  }

  public createWebhook = async (siteID: string, webhookUrl: string): Promise<void> => {
    const path = `/sites/${siteID}/webhooks`
    const { data } = await this._axiosClient.get<{ webhooks: { triggerType: string }[] }>(path)
    const triggerTypesToHook = [
      'form_submission',
      'site_publish',
      'page_created',
      'page_metadata_updated',
      'page_deleted',
      'collection_item_created',
      'collection_item_changed',
      'collection_item_deleted',
      'collection_item_published',
      'collection_item_unpublished',
      'comment_created',
    ]

    const existing = new Set(data.webhooks.map((w) => w.triggerType))
    const missing = triggerTypesToHook.filter((t) => !existing.has(t))

    for (const triggerType of missing) {
      await this._axiosClient.post(path, {
        triggerType,
        url: webhookUrl,
      })
    }
  }

  public deleteWebhooks = async (siteID: string): Promise<void> => {
    const listPath = `/sites/${siteID}/webhooks`
    const listResp = await this._axiosClient.get(listPath)
    const webhookIDs = listResp.data.webhooks.map((w: { id: string }) => w.id)
    for (const webhookID of webhookIDs) {
      await this._axiosClient.delete(`/webhooks/${webhookID}`)
    }
  }
}
