import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { getAccessToken } from '../auth'
import { ensureExtension, getMediaMetadata } from './utils/media'
import * as bp from '.botpress'

const HUBSPOT_API_BASE_URL = 'https://api.hubapi.com'

// Retry infrastructure
type RetryConfig = {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 32000,
  backoffMultiplier: 2,
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(config.baseDelay * Math.pow(config.backoffMultiplier, attempt), config.maxDelay)
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5)
  return Math.floor(exponentialDelay + jitter)
}

function isRateLimitError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  return error.response?.status === 429 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT'
}

function getRetryAfterMs(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null
  const retryAfter = error.response?.headers?.['retry-after']
  if (!retryAfter) return null
  const parsed = parseInt(retryAfter, 10)
  if (!isNaN(parsed)) return parsed * 1000
  const date = new Date(retryAfter)
  if (!isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now())
  return null
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T | null
}

export type ThreadInfo = {
  id: string
  associatedContactId: string
}
export class HubSpotHitlClient {
  private _ctx: bp.Context
  private _bpClient: bp.Client
  private _logger: bp.Logger

  public constructor(ctx: bp.Context, bpClient: bp.Client, logger: bp.Logger) {
    this._ctx = ctx
    this._bpClient = bpClient
    this._logger = logger
  }

  private async _makeHitlRequest<T>(
    endpoint: string,
    method: string = 'GET',
    data: any = null,
    params: any = {},
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<ApiResponse<T>> {
    const accessToken = await getAccessToken({ client: this._bpClient, ctx: this._ctx })

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    }
    if (method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json'
    }

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        this._logger.forBot().debug(`Making request to ${method} ${endpoint}`)
        const response = await axios({ method, url: endpoint, headers, data, params })
        return { success: true, message: 'Request successful', data: response.data }
      } catch (thrown: unknown) {
        const isLast = attempt >= retryConfig.maxRetries
        if (!isLast && isRateLimitError(thrown)) {
          const delay = getRetryAfterMs(thrown) ?? calculateDelay(attempt, retryConfig)
          this._logger
            .forBot()
            .warn(`Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${retryConfig.maxRetries})`)
          await sleep(delay)
          continue
        }
        const errData = axios.isAxiosError(thrown) ? thrown.response?.data : undefined
        const message = thrown instanceof Error ? thrown.message : String(thrown)
        this._logger.forBot().error('HubSpot API error:', errData || message)
        return { success: false, message: errData?.message || message, data: null }
      }
    }
    return { success: false, message: 'Max retries exceeded', data: null }
  }

  public async getThreadInfo(threadId: string): Promise<ThreadInfo> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/conversations/threads/${threadId}`
    const response = await this._makeHitlRequest<ThreadInfo>(endpoint, 'GET')
    if (!response.success || !response.data) {
      throw new RuntimeError(`Failed to fetch thread info: ${response.message}`)
    }
    return response.data
  }

  public async getActorEmail(actorId: string): Promise<string> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/conversations/actors/${actorId}`
    const response = await this._makeHitlRequest<{ email: string }>(endpoint, 'GET')
    if (!response.success || !response.data) {
      throw new RuntimeError(`Failed to fetch actor info: ${response.message}`)
    }
    return response.data.email
  }

  public async getActorDetails(
    actorId: string
  ): Promise<{ id: string; name: string; email: string; avatar: string; type: string }> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/conversations/actors/${actorId}`
    const response = await this._makeHitlRequest<{
      id: string
      name: string
      email: string
      avatar: string
      type: string
    }>(endpoint, 'GET')
    if (!response.success || !response.data) {
      throw new RuntimeError(`Failed to fetch actor details: ${response.message}`)
    }
    return response.data
  }

  public async getActorPhoneNumber(contactId: string): Promise<string> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/crm/v3/objects/contacts/${contactId}?properties=phone`
    const response = await this._makeHitlRequest<{ properties: { phone: string } }>(endpoint, 'GET', null, {
      archived: false,
    })
    if (!response.success || !response.data) {
      throw new RuntimeError(`Failed to fetch contact phone: ${response.message}`)
    }
    return response.data.properties.phone
  }

  public async createCustomChannel(appId: string, developerApiKey?: string): Promise<string> {
    const params: Record<string, string> = { appId }
    if (developerApiKey) params.hapikey = developerApiKey

    const response = await this._makeHitlRequest<{ id: string }>(
      `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels`,
      'POST',
      {
        name: 'Botpress HITL',
        webhookUrl: `${process.env.BP_WEBHOOK_URL}/${this._ctx.webhookId}`,
        capabilities: {
          deliveryIdentifierTypes: ['CHANNEL_SPECIFIC_OPAQUE_ID'],
          richText: ['HYPERLINK', 'TEXT_ALIGNMENT', 'BLOCKQUOTE'],
          threadingModel: 'INTEGRATION_THREAD_ID',
          allowInlineImages: false,
          allowOutgoingMessages: true,
          allowConversationStart: true,
          maxFileAttachmentCount: 1,
          allowMultipleRecipients: false,
          outgoingAttachmentTypes: ['FILE'],
          maxFileAttachmentSizeBytes: 10_000_000,
          maxTotalFileAttachmentSizeBytes: 10_000_000,
          allowedFileAttachmentMimeTypes: ['image/*', 'audio/*', 'video/*', 'application/*', 'text/*'],
        },
        channelAccountConnectionRedirectUrl: 'https://example.com',
        channelDescription: 'Botpress custom channel integration.',
        channelLogoUrl: 'https://i.imgur.com/CAu3kb7.png',
      },
      params
    )

    if (!response.success || !response.data) {
      throw new RuntimeError(`createCustomChannel failed: ${response.message}`)
    }
    return response.data.id
  }

  public async getCustomChannels(
    appId: string,
    developerApiKey?: string
  ): Promise<{ results: Array<{ id: string; webhookUrl: string }> }> {
    const params: Record<string, string> = { appId }
    if (developerApiKey) params.hapikey = developerApiKey

    const response = await this._makeHitlRequest<{ results: Array<{ id: string; webhookUrl: string }> }>(
      `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels`,
      'GET',
      null,
      params
    )
    if (!response.success || !response.data) {
      throw new RuntimeError(`getCustomChannels failed: ${response.message}`)
    }
    return response.data
  }

  public async deleteCustomChannel(
    channelId: string,
    appId: string,
    developerApiKey?: string
  ): Promise<{ success: boolean }> {
    const params: Record<string, string> = { appId }
    if (developerApiKey) params.hapikey = developerApiKey

    const response = await this._makeHitlRequest(
      `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels/${channelId}`,
      'DELETE',
      null,
      params
    )
    if (response.success) {
      this._logger.forBot().info(`Deleted custom channel ${channelId}`)
    } else {
      this._logger.forBot().error(`Failed to delete custom channel ${channelId}: ${response.message}`)
    }
    return { success: response.success }
  }

  public async connectCustomChannel(
    channelId: string,
    inboxOrHelpDeskId: string,
    channelName: string
  ): Promise<ApiResponse<{ id: string }>> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels/${channelId}/channel-accounts`
    const payload = {
      name: channelName,
      inboxId: inboxOrHelpDeskId,
      deliveryIdentifier: { type: 'CHANNEL_SPECIFIC_OPAQUE_ID', value: `botpress-${inboxOrHelpDeskId}` },
      authorized: true,
    }
    const response = await this._makeHitlRequest<{ id: string }>(endpoint, 'POST', payload)
    if (!response.success || !response.data) {
      throw new RuntimeError(`connectCustomChannel failed: ${response.message}`)
    }
    return response
  }

  public async listChannelAccounts(channelId: string): Promise<Array<{ id: string; inboxId: string }>> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels/${channelId}/channel-accounts`
    const response = await this._makeHitlRequest<{ results: Array<{ id: string; inboxId: string }> }>(endpoint, 'GET')
    if (!response.success || !response.data) {
      throw new RuntimeError(`listChannelAccounts failed: ${response.message}`)
    }
    return response.data.results
  }

  public async createConversation(
    channelId: string,
    channelAccountId: string,
    integrationThreadId: string,
    name: string,
    contactIdentifier: string,
    title: string,
    description: string
  ): Promise<any> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels/${channelId}/messages`
    const isEmail = contactIdentifier.includes('@')
    const deliveryType = isEmail ? 'HS_EMAIL_ADDRESS' : 'HS_PHONE_NUMBER'

    const payload = {
      text: `Title: ${title}\nDescription: ${description}`,
      messageDirection: 'INCOMING',
      integrationThreadId,
      channelAccountId,
      senders: [
        {
          name,
          deliveryIdentifier: { type: deliveryType, value: contactIdentifier },
        },
      ],
    }

    const response = await this._makeHitlRequest(endpoint, 'POST', payload)
    if (!response.success) {
      throw new RuntimeError(`createConversation failed: ${response.message}`)
    }
    return response
  }

  public async listInboxes(): Promise<Array<{ id: string; name: string }>> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/conversations/inboxes`
    const response = await this._makeHitlRequest<{ results: Array<{ id: string; name: string }> }>(endpoint, 'GET')
    if (!response.success || !response.data) {
      throw new RuntimeError(`listInboxes failed: ${response.message}`)
    }
    return response.data.results
  }

  private async _uploadFile(
    fileUrl: string,
    name: string,
    integrationThreadId: string,
    contentType?: string
  ): Promise<string> {
    const accessToken = await getAccessToken({ client: this._bpClient, ctx: this._ctx })

    const fileResponse = await axios.get<ArrayBuffer>(fileUrl, { responseType: 'arraybuffer' })

    const formData = new FormData()
    formData.append('file', new Blob([fileResponse.data], contentType ? { type: contentType } : undefined), name)
    formData.append('folderPath', `/botpress-hitl/${integrationThreadId}`)
    formData.append('options', JSON.stringify({ access: 'PRIVATE', ttl: 'P1Y' }))

    const uploadResponse = await axios.post(`${HUBSPOT_API_BASE_URL}/filemanager/api/v3/files/upload`, formData, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const fileId = uploadResponse.data?.objects?.[0]?.id
    if (!fileId) {
      throw new RuntimeError('HubSpot file upload returned no fileId')
    }
    return String(fileId)
  }

  public async sendMessage(
    message: string,
    senderName: string,
    contactIdentifier: string,
    integrationThreadId: string,
    channelId: string,
    channelAccountId: string,
    attachment?: {
      url: string
      name: string
      fileUsageType: 'IMAGE' | 'AUDIO' | 'VOICE_RECORDING' | 'STICKER' | 'OTHER'
    }
  ): Promise<any> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/custom-channels/${channelId}/messages`
    const isEmail = contactIdentifier.includes('@')
    const deliveryType = isEmail ? 'HS_EMAIL_ADDRESS' : 'HS_PHONE_NUMBER'

    const attachments: Array<{ type: string; fileId: string; name: string; fileUsageType: string }> = []
    if (attachment) {
      const metadata = await getMediaMetadata(attachment.url)
      const name = metadata.fileName ?? ensureExtension(attachment.name, attachment.url)
      const fileId = await this._uploadFile(attachment.url, name, integrationThreadId, metadata.mimeType)
      attachments.push({ type: 'FILE', fileId, name, fileUsageType: attachment.fileUsageType })
    }

    const payload = {
      type: 'MESSAGE',
      text: message,
      messageDirection: 'INCOMING',
      integrationThreadId,
      channelAccountId,
      senders: [
        {
          name: senderName,
          deliveryIdentifier: { type: deliveryType, value: contactIdentifier },
        },
      ],
      attachments,
    }

    const response = await this._makeHitlRequest(endpoint, 'POST', payload)
    if (!response.success) {
      throw new RuntimeError(`sendMessage failed: ${response.message}`)
    }
    return response
  }

  public async closeThread(threadId: string): Promise<void> {
    const endpoint = `${HUBSPOT_API_BASE_URL}/conversations/v3/conversations/threads/${threadId}`
    const response = await this._makeHitlRequest(endpoint, 'PATCH', { status: 'CLOSED' })
    if (!response.success) {
      throw new RuntimeError(`closeThread failed: ${response.message}`)
    }
  }
}

export const getHitlClient = (ctx: bp.Context, bpClient: bp.Client, logger: bp.Logger): HubSpotHitlClient =>
  new HubSpotHitlClient(ctx, bpClient, logger)
