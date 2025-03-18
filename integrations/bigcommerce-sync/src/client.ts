import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import * as bp from '.botpress'

export class BigCommerceClient {
  private client: AxiosInstance
  private baseUrl: string

  constructor(private config: bp.configuration.Configuration) {
    this.baseUrl = `https://api.bigcommerce.com/stores/${config.storeHash}`
    this.client = axios.create({
      headers: {
        'X-Auth-Token': config.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  async getProducts(params?: Record<string, any>) {
    try {
      const response = await this.client.get(`${this.baseUrl}/v3/catalog/products`, { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getProduct(productId: string) {
    try {
      const response = await this.client.get(`${this.baseUrl}/v3/catalog/products/${productId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getCategories() {
    try {
      const response = await this.client.get(`${this.baseUrl}/v3/catalog/categories`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getBrands() {
    try {
      const response = await this.client.get(`${this.baseUrl}/v3/catalog/brands`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async makeRequest(config: AxiosRequestConfig) {
    try {
      const url = config.url?.startsWith('http') 
        ? config.url 
        : `${this.baseUrl}${config.url}`
      
      const response = await this.client.request({
        ...config,
        url
      })
      
      return {
        status: response.status,
        data: response.data
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async createWebhook(scope: string, destination: string) {
    try {
      const response = await this.client.post(`${this.baseUrl}/v3/hooks`, {
        scope,
        destination,
        is_active: true,
        headers: {}
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async createProductWebhooks(destination: string) {
    if (!destination) {
      throw new Error('Webhook destination URL is required')
    }
    
    const webhookEvents = [
      'store/product/updated',
      'store/product/created',
      'store/product/deleted'
    ]
    
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

  private handleError(error: any) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      return new Error(`BigCommerce API Error: ${message}`)
    }
    return error
  }
}

export const getBigCommerceClient = (config: bp.configuration.Configuration): BigCommerceClient =>
  new BigCommerceClient(config)