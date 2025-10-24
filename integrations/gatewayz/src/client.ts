import { fetch } from 'undici'
import * as bp from '.botpress'

export class GatewayzClient {
  private baseUrl: string
  private apiKey: string

  constructor(config: bp.configuration.Configuration) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, '') || 'https://gatewayz-app.vercel.app'
    this.apiKey = config.apiKey
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    // Add Authorization header for secured endpoints
    if (this.apiKey && !endpoint.includes('/auth/register') && !endpoint.includes('/health') && !endpoint.includes('/models')) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      return { success: true, data, error: undefined }
    } catch (error) {
      console.error(`Gatewayz API Error: ${error}`)
      return { 
        success: false, 
        data: undefined, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  async healthCheck() {
    const result = await this.makeRequest('/health')
    return {
      status: result.success ? 'healthy' : 'unhealthy',
      success: result.success,
      error: result.error
    }
  }

  async getModels() {
    const result = await this.makeRequest('/models')
    return {
      models: result.success ? result.data : [],
      success: result.success,
      error: result.error
    }
  }

  async getProviders() {
    const result = await this.makeRequest('/models/providers')
    return {
      providers: result.success ? result.data : [],
      success: result.success,
      error: result.error
    }
  }

  async getUserBalance() {
    const result = await this.makeRequest('/user/balance')
    return {
      balance: result.success ? result.data?.balance : undefined,
      credits: result.success ? result.data?.credits : undefined,
      success: result.success,
      error: result.error
    }
  }

  async getUserProfile() {
    const result = await this.makeRequest('/user/profile')
    if (!result.success) {
      return { 
        success: false, 
        error: result.error,
        user_id: 0,
        username: null,
        email: null,
        api_key: '',
        credits: 0,
        auth_method: null,
        subscription_status: null,
        trial_expires_at: null,
        is_active: null,
        registration_date: null,
        created_at: null,
        updated_at: null
      }
    }

    return {
      ...result.data,
      success: true,
      error: undefined
    }
  }

  async updateUserProfile(input: any) {
    const result = await this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(input)
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        user_id: 0,
        username: null,
        email: null,
        api_key: '',
        credits: 0,
        auth_method: null,
        subscription_status: null,
        trial_expires_at: null,
        is_active: null,
        registration_date: null,
        created_at: null,
        updated_at: null
      }
    }

    return {
      ...result.data,
      success: true,
      error: undefined
    }
  }

  async createApiKey(input: any) {
    const result = await this.makeRequest('/user/api-keys', {
      method: 'POST',
      body: JSON.stringify(input)
    })
    return {
      success: result.success,
      data: result.data,
      error: result.error
    }
  }

  async getApiKeyUsage() {
    const result = await this.makeRequest('/user/api-keys/usage')
    return {
      usage: result.success ? result.data : undefined,
      success: result.success,
      error: result.error
    }
  }

  async registerUser(input: any) {
    const result = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        user_id: 0,
        username: '',
        email: '',
        api_key: '',
        credits: 0,
        environment_tag: '',
        scope_permissions: {},
        auth_method: '',
        subscription_status: '',
        message: '',
        timestamp: ''
      }
    }

    return {
      ...result.data,
      success: true,
      error: undefined
    }
  }

  async chatCompletions(input: any) {
    const result = await this.makeRequest('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        ...(input.max_tokens && { max_tokens: input.max_tokens }),
        ...(input.temperature && { temperature: input.temperature }),
        ...(input.top_p && { top_p: input.top_p }),
        ...(input.frequency_penalty && { frequency_penalty: input.frequency_penalty }),
        ...(input.presence_penalty && { presence_penalty: input.presence_penalty })
      })
    })

    return {
      response: result.success ? result.data : undefined,
      success: result.success,
      error: result.error
    }
  }
}
