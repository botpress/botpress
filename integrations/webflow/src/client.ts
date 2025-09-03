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

  public listItems = async (collectionID: string, offset: number, limit: number, isLiveItems?: boolean) => {
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
}
