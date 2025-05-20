import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import * as bp from '.botpress'

export type ProductQueryParams = {
  id?: number | number[]
  name?: string
  sku?: string
  price?: number
  page?: number
  limit?: number
  include?: string
  brand_id?: number
  categories?: number | number[]
  keyword?: string
  status?: string
  include_fields?: string
  exclude_fields?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

export class BigCommerceClient {
  private _client: AxiosInstance
  private _baseUrl: string

  public constructor(private _config: bp.configuration.Configuration) {
    this._baseUrl = `https://api.bigcommerce.com/stores/${_config.storeHash}`
    this._client = axios.create({
      headers: {
        'X-Auth-Token': _config.accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  public async getProducts(params?: ProductQueryParams) {
    try {
      const updatedParams = {
        ...params,
        include: params?.include ? `${params.include},images` : 'images',
      }
      const response = await this._client.get(`${this._baseUrl}/v3/catalog/products`, { params: updatedParams })
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async getProduct(productId: string) {
    try {
      const response = await this._client.get(`${this._baseUrl}/v3/catalog/products/${productId}`, {
        params: { include: 'images' },
      })
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async getCategories() {
    try {
      const response = await this._client.get(`${this._baseUrl}/v3/catalog/categories`)
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async getBrands() {
    try {
      const response = await this._client.get(`${this._baseUrl}/v3/catalog/brands`)
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async makeRequest(config: AxiosRequestConfig) {
    try {
      const url = config.url?.startsWith('http') ? config.url : `${this._baseUrl}${config.url}`

      const response = await this._client.request({
        ...config,
        url,
      })

      return {
        status: response.status,
        data: response.data,
      }
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async createWebhook(scope: string, destination: string) {
    try {
      const response = await this._client.post(`${this._baseUrl}/v3/hooks`, {
        scope,
        destination,
        is_active: true,
        headers: {},
      })
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async createProductWebhooks(destination: string) {
    if (!destination) {
      throw new Error('Webhook destination URL is required')
    }

    const webhookEvents = ['store/product/updated', 'store/product/created', 'store/product/deleted']

    const results = []

    for (const event of webhookEvents) {
      try {
        const result = await this.createWebhook(event, destination)
        results.push({ event, success: true, data: result })
      } catch (error) {
        results.push({ event, success: false, error: error instanceof Error ? error.message : String(error) })
      }
    }

    return results
  }

  private _handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      return new Error(`BigCommerce API Error: ${message}`)
    }
    return error instanceof Error ? error : new Error(String(error))
  }
}

export const getBigCommerceClient = (config: bp.configuration.Configuration): BigCommerceClient =>
  new BigCommerceClient(config)
