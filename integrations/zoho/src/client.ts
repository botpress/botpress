import { IntegrationLogger } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import * as bp from '.botpress'

const logger = new IntegrationLogger()

// Define a Map for Zoho Data Centers
const zohoAuthUrls = new Map<string, string>([
  ['us', 'https://accounts.zoho.com'],
  ['eu', 'https://accounts.zoho.eu'],
  ['in', 'https://accounts.zoho.in'],
  ['au', 'https://accounts.zoho.com.au'],
  ['cn', 'https://accounts.zoho.com.cn'],
  ['jp', 'https://accounts.zoho.jp'],
  ['ca', 'https://accounts.zohocloud.ca'],
])

const zohoDataCenterTLDs = new Map<string, string>([
  ['us', 'com'],
  ['eu', 'eu'],
  ['in', 'in'],
  ['au', 'com.au'],
  ['cn', 'com.cn'],
  ['jp', 'jp'],
  ['ca', 'ca'],
])

// Function to get the Zoho Auth URL
const getZohoAuthUrl = (region: string): string => zohoAuthUrls.get(region) ?? 'https://accounts.zoho.com'

const getZohoDataCenterTLD = (region: string): string => zohoDataCenterTLDs.get(region) ?? 'com'

export class ZohoApi {
  private _refreshToken: string
  private _clientId: string
  private _clientSecret: string
  private _dataCenter: string
  private _baseUrl: string
  private _ctx: bp.Context
  private _bpClient: bp.Client

  public constructor(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    dataCenter: string,
    ctx: bp.Context,
    bpClient: bp.Client
  ) {
    this._refreshToken = refreshToken
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._dataCenter = dataCenter
    this._ctx = ctx
    this._bpClient = bpClient
    this._baseUrl = `https://www.zohoapis.${getZohoDataCenterTLD(dataCenter)}`
  }

  /** Retrieves stored credentials from Botpress state */
  private async _getStoredCredentials(): Promise<{ accessToken: string } | null> {
    try {
      const { state } = await this._bpClient.getState({
        id: this._ctx.integrationId,
        name: 'credentials',
        type: 'integration',
      })

      if (!state?.payload?.accessToken) {
        logger.forBot().error('No credentials found in state')
        return null
      }

      return {
        accessToken: state.payload.accessToken,
      }
    } catch (error) {
      logger.forBot().error('Error retrieving credentials from state:', error)
      return null
    }
  }

  private async _makeRequest(
    endpoint: string,
    method: string = 'GET',
    data: any = null,
    params: any = {}
  ): Promise<any> {
    try {
      const creds = await this._getStoredCredentials()
      if (!creds) {
        logger.forBot().error('Error retrieving credentials.')
        throw new Error('Error grabbing credentials.')
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${creds.accessToken}`,
        Accept: 'application/json',
      }
      logger.forBot().info('accessToken', creds.accessToken)
      if (method !== 'GET' && method !== 'DELETE') {
        headers['Content-Type'] = 'application/json'
      }
      logger.forBot().info(`Making request to ${method} ${this._baseUrl}${endpoint}`)
      logger.forBot().info('Params:', params)

      const response = await axios({
        method,
        url: `${this._baseUrl}${endpoint}`,
        headers,
        data,
        params,
      })

      return { success: true, message: 'Request successful', data: response.data }
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.forBot().warn('Access token expired. Refreshing...', error)
        await this._refreshAccessToken()
        return this._makeRequest(endpoint, method, data, params)
      }
      logger.forBot().error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message)
      return { success: false, message: error.response?.data?.message || error.message, data: null }
    }
  }

  private async _makeFileUploadRequest(endpoint: string, formData: FormData): Promise<any> {
    try {
      const creds = await this._getStoredCredentials()
      if (!creds) {
        logger.forBot().error('Error retrieving credentials.')
        throw new Error('Error grabbing credentials.')
      }

      const headers = {
        Authorization: `Bearer ${creds.accessToken}`,
        ...formData.getHeaders(),
      }

      logger.forBot().info(`Uploading file to ${this._baseUrl}${endpoint}`)

      const response = await axios.post(`${this._baseUrl}${endpoint}`, formData, { headers })

      return { success: true, message: 'File uploaded successfully', data: response.data }
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.forBot().warn('Access token expired. Refreshing...', error)
        await this._refreshAccessToken()
        return this._makeFileUploadRequest(endpoint, formData)
      }
      logger.forBot().error(`Error in file upload ${endpoint}:`, error.response?.data || error.message)
      return { success: false, message: error.response?.data?.message || error.message, data: null }
    }
  }

  async _refreshAccessToken() {
    try {
      const requestData = new URLSearchParams()
      requestData.append('client_id', this._clientId)
      requestData.append('client_secret', this._clientSecret)
      requestData.append('refresh_token', this._refreshToken)
      requestData.append('grant_type', 'refresh_token')

      const response = await axios.post(
        `${getZohoAuthUrl(this._ctx.configuration.dataCenter)}/oauth/v2/token`,
        requestData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      await this._bpClient.setState({
        id: this._ctx.integrationId,
        type: 'integration',
        name: 'credentials',
        payload: {
          accessToken: response.data.access_token,
        },
      })

      logger.forBot().info('Access token refreshed successfully.')
    } catch (error: unknown) {
      const err = error as AxiosError
      logger.forBot().error(err.response?.data)
      logger.forBot().error('Error refreshing access token:', err.response?.data || err.message)
      throw new Error('Authentication error. Please reauthorize the integration.')
    }
  }

  public async makeApiCall(endpoint: string, method: string = 'GET', data: any = null, rawParams: any = {}) {
    const params = JSON.parse(rawParams)
    return this._makeRequest(endpoint, method, data, params)
  }

  public async insertRecord(module: string, rawData: string) {
    const data = JSON.parse(rawData)
    return this._makeRequest(`/crm/v7/${module}`, 'POST', { data })
  }

  public async getRecords(module: string, rawParams: string = '{}') {
    const params = JSON.parse(rawParams)
    return this._makeRequest(`/crm/v7/${module}`, 'GET', null, params)
  }

  public async getRecordById(module: string, recordId: string, params: any = {}) {
    return this._makeRequest(`/crm/v7/${module}/${recordId}`, 'GET', null, params)
  }

  public async updateRecord(module: string, recordId: string, rawData: string) {
    const data = JSON.parse(rawData)
    return this._makeRequest(`/crm/v7/${module}/${recordId}`, 'PUT', { data })
  }

  public async deleteRecord(module: string, recordId: string) {
    return this._makeRequest(`/crm/v7/${module}/${recordId}`, 'DELETE')
  }

  public async searchRecords(module: string, criteria: string) {
    return this._makeRequest(`/crm/v7/${module}/search`, 'GET', null, { criteria })
  }

  public async getOrganizationDetails() {
    return this._makeRequest('/crm/v7/org', 'GET')
  }

  public async getUsers(rawParams?: string) {
    const params = rawParams ? JSON.parse(rawParams) : {}
    return this._makeRequest('/crm/v7/users', 'GET', null, params)
  }

  public async downloadFileBuffer(fileUrl: string): Promise<Blob> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      })

      const contentType = response.headers['content-type'] || 'application/octet-stream'

      return new Blob([response.data], { type: contentType })
    } catch (error) {
      logger.forBot().error('Error downloading the file:', error)
      throw error
    }
  }

  public async uploadFile(fileUrl: string) {
    logger.forBot().error('FILE URL SHARK: ', fileUrl)

    try {
      const file = await this.downloadFileBuffer(fileUrl)

      const fileName = fileUrl.split('/').pop() || 'uploaded_file'

      const buffer = Buffer.from(await file.arrayBuffer())

      const formData = new FormData()
      formData.append('file', buffer, fileName)

      return this._makeFileUploadRequest('/crm/v7/files', formData)
    } catch (error) {
      logger.forBot().error('Error uploading file:', error)
      throw error
    }
  }

  public async getFile(fileId: string) {
    return this._makeRequest('/crm/v7/files', 'GET', null, { id: fileId })
  }

  public async getAppointments(rawParams: string = '{}') {
    const params = JSON.parse(rawParams)
    return this._makeRequest('/crm/v7/Appointments__s', 'GET', null, params)
  }

  public async getAppointmentById(appointmentId: string) {
    return this._makeRequest(`/crm/v7/Appointments__s/${appointmentId}`)
  }

  public async createAppointment(rawData: string) {
    const data = JSON.parse(rawData)
    return this._makeRequest('/crm/v7/Appointments__s', 'POST', { data })
  }

  public async updateAppointment(appointmentId: string, rawData: string) {
    const data = JSON.parse(rawData)
    return this._makeRequest(`/crm/v7/Appointments__s/${appointmentId}`, 'PUT', { data })
  }

  public async deleteAppointment(appointmentId: string) {
    return this._makeRequest(`/crm/v7/Appointments__s/${appointmentId}`, 'DELETE')
  }

  public async sendMail(module: string, recordId: string, rawData: string) {
    const data = JSON.parse(rawData)
    return this._makeRequest(`/crm/v7/${module}/${recordId}/actions/send_mail`, 'POST', { data })
  }
}

export const getClient = (
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  dataCenter: string,
  ctx: bp.Context,
  bpClient: bp.Client
) => {
  return new ZohoApi(refreshToken, clientId, clientSecret, dataCenter, ctx, bpClient)
}
