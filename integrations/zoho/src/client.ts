import { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'
import FormData from 'form-data'
import { DataCenter, getZohoApiBaseUrl, getZohoAuthUrl, isDataCenter } from './misc/data-centers'
import * as bp from '.botpress'

const logger = new IntegrationLogger()
const OAUTH_CLIENT_ID = bp.secrets.CLIENT_ID
const OAUTH_CLIENT_SECRET = bp.secrets.CLIENT_SECRET

// Retry once after refreshing the access token. If Zoho still returns 401,
// the credentials are likely revoked, mis-scoped, or tied to the wrong data center.
const MAX_AUTH_RETRIES = 1

type AuthMode = 'oauth' | 'manual'
type StoredCredentials = {
  accessToken: string
  refreshToken?: string
  dataCenter?: DataCenter
  apiDomain?: string
  expiresAt?: number
}
type LegacyConfiguration = {
  clientId: string
  clientSecret: string
  refreshToken: string
  dataCenter: DataCenter
}

const _getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message
  }

  return error instanceof Error ? error.message : 'Unknown error'
}

const _getErrorLogData = (error: unknown): unknown => {
  if (axios.isAxiosError(error)) {
    return error.response?.data ?? error.message
  }

  return error instanceof Error ? error.message : error
}

const _getLegacyConfiguration = (configuration: unknown): LegacyConfiguration | null => {
  if (!configuration || typeof configuration !== 'object') {
    return null
  }

  const maybeConfiguration = configuration as Record<string, unknown>
  const { clientId, clientSecret, refreshToken, dataCenter } = maybeConfiguration
  if (
    typeof clientId !== 'string' ||
    typeof clientSecret !== 'string' ||
    typeof refreshToken !== 'string' ||
    typeof dataCenter !== 'string' ||
    !isDataCenter(dataCenter)
  ) {
    return null
  }

  return { clientId, clientSecret, refreshToken, dataCenter }
}

export class ZohoApi {
  private _refreshToken: string
  private _clientId: string
  private _clientSecret: string
  private _dataCenter: DataCenter
  private _baseUrl: string
  private _ctx: bp.Context
  private _bpClient: bp.Client
  private _authMode: AuthMode

  public constructor(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    dataCenter: DataCenter,
    ctx: bp.Context,
    bpClient: bp.Client,
    authMode: AuthMode = 'manual',
    apiDomain?: string
  ) {
    this._refreshToken = refreshToken
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._dataCenter = dataCenter
    this._ctx = ctx
    this._bpClient = bpClient
    this._authMode = authMode
    this._baseUrl = apiDomain ?? getZohoApiBaseUrl(dataCenter)
  }

  /** Retrieves stored credentials from Botpress state */
  private async _getStoredCredentials(): Promise<StoredCredentials | null> {
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
        refreshToken: state.payload.refreshToken,
        dataCenter: state.payload.dataCenter,
        apiDomain: state.payload.apiDomain,
        expiresAt: state.payload.expiresAt,
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
    params: any = {},
    retryCount: number = 0
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && retryCount < MAX_AUTH_RETRIES) {
        logger.forBot().warn('Access token expired. Refreshing...', error)
        await this.refreshAccessToken()
        return this._makeRequest(endpoint, method, data, params, retryCount + 1)
      }
      logger.forBot().error(`Error in ${method} ${endpoint}:`, _getErrorLogData(error))
      return { success: false, message: _getErrorMessage(error), data: null }
    }
  }

  private async _makeFileUploadRequest(endpoint: string, formData: FormData, retryCount: number = 0): Promise<any> {
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && retryCount < MAX_AUTH_RETRIES) {
        logger.forBot().warn('Access token expired. Refreshing...', error)
        await this.refreshAccessToken()
        return this._makeFileUploadRequest(endpoint, formData, retryCount + 1)
      }
      logger.forBot().error(`Error in file upload ${endpoint}:`, _getErrorLogData(error))
      return { success: false, message: _getErrorMessage(error), data: null }
    }
  }

  public async refreshAccessToken() {
    try {
      const requestData = new URLSearchParams()
      requestData.append('client_id', this._clientId)
      requestData.append('client_secret', this._clientSecret)
      requestData.append('refresh_token', this._refreshToken)
      requestData.append('grant_type', 'refresh_token')

      const response = await axios.post(`${getZohoAuthUrl(this._dataCenter)}/oauth/v2/token`, requestData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const currentCredentials = await this._getStoredCredentials()

      await this._bpClient.setState({
        id: this._ctx.integrationId,
        type: 'integration',
        name: 'credentials',
        payload: {
          ...currentCredentials,
          accessToken: response.data.access_token,
          refreshToken: this._authMode === 'oauth' ? this._refreshToken : currentCredentials?.refreshToken,
          dataCenter: this._authMode === 'oauth' ? this._dataCenter : currentCredentials?.dataCenter,
          apiDomain: response.data.api_domain ?? currentCredentials?.apiDomain,
          expiresAt: response.data.expires_in
            ? Date.now() + response.data.expires_in * 1000
            : currentCredentials?.expiresAt,
        },
      })

      logger.forBot().info('Access token refreshed successfully.')
    } catch (error: unknown) {
      logger.forBot().error(_getErrorLogData(error))
      logger.forBot().error('Error refreshing access token:', _getErrorLogData(error))
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

export const getClient = async (ctx: bp.Context, bpClient: bp.Client): Promise<ZohoApi> => {
  const manualConfiguration =
    ctx.configurationType === 'manual' ? ctx.configuration : _getLegacyConfiguration(ctx.configuration)

  if (manualConfiguration) {
    return new ZohoApi(
      manualConfiguration.refreshToken,
      manualConfiguration.clientId,
      manualConfiguration.clientSecret,
      manualConfiguration.dataCenter,
      ctx,
      bpClient,
      'manual'
    )
  }

  const { state } = await bpClient.getState({
    id: ctx.integrationId,
    name: 'credentials',
    type: 'integration',
  })
  const credentials = state.payload
  if (!credentials.refreshToken || !credentials.dataCenter) {
    throw new Error('Zoho OAuth credentials not found. Please reconnect the integration.')
  }

  return new ZohoApi(
    credentials.refreshToken,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    credentials.dataCenter,
    ctx,
    bpClient,
    'oauth',
    credentials.apiDomain
  )
}
