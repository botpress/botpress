import { RuntimeError } from '@botpress/sdk'
import docusign from 'docusign-esign'
import type { CommonHandlerProps } from '../types'
import { getAccountState, getOAuthState } from './auth-utils'
import { refreshWebhooks } from './utils'

type DocusignClientParams = {
  accountId: string
  baseUri: string
  accessToken: string
  tokenType: string
}

export class DocusignClient {
  private _apiClient: docusign.ApiClient
  private _accountId: string

  private constructor(params: DocusignClientParams) {
    const { baseUri, tokenType, accessToken, accountId } = params
    this._accountId = accountId

    this._apiClient = new docusign.ApiClient()
    this._apiClient.addDefaultHeader('Authorization', `${tokenType} ${accessToken}`)
    this._apiClient.setBasePath(baseUri)
  }

  private get _envelopesApi() {
    return new docusign.EnvelopesApi(this._apiClient)
  }

  /** AKA: Webhooks api */
  private get _connectApi() {
    return new docusign.ConnectApi(this._apiClient)
  }

  public async sendEnvelope(envelope: docusign.EnvelopeDefinition) {
    try {
      const resp = await this._envelopesApi.createEnvelope(this._accountId, {
        envelopeDefinition: envelope,
      })

      if (!resp.envelopeId) {
        const message = resp.errorDetails ? resp.errorDetails.message : 'Did not receive EnvelopeID from Docusign'
        throw new Error(message)
      }

      return {
        envelopeId: resp.envelopeId,
      }
    } catch (thrown: unknown) {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError('Failed to send envelope', err)
    }
  }

  public async getWebhooksList(): Promise<docusign.ConnectConfigResults['configurations']> {
    const resp = await this._connectApi.listConfigurations(this._accountId)
    return resp.configurations
  }

  public async createWebhook(webhookUrl: string, botId: string): Promise<string> {
    try {
      const resp = await this._connectApi.createConfiguration(this._accountId, {
        configurationType: 'custom',
        urlToPublishTo: webhookUrl,
        name: `Botpress Integration | Bot ID: ${botId}`,
        allowEnvelopePublish: 'true',
        enableLog: 'true',
        deliveryMode: 'SIM',
        requiresAcknowledgement: 'true',
        signMessageWithX509Certificate: 'true',
        includeTimeZoneInformation: 'true',
        includeHMAC: 'false',
        includeEnvelopeVoidReason: 'false',
        includeSenderAccountasCustomField: 'true',
        envelopeEvents: ['Sent', 'Delivered', 'Completed', 'Declined', 'Voided'],
        recipientEvents: ['Sent', 'AutoResponded', 'Delivered', 'Completed', 'Declined', 'AuthenticationFailed'],
        allUsers: 'true',
        eventData: {
          version: 'restv2.1',
        },
      })

      const { connectId } = resp
      if (!connectId) {
        throw new RuntimeError('Failed to create webhook due to unexpected api response')
      }
      return connectId
    } catch (thrown: unknown) {
      if (thrown instanceof RuntimeError) {
        throw thrown
      }

      const error = thrown instanceof Error ? new RuntimeError(thrown.message) : new RuntimeError(String(thrown))
      throw error
    }
  }

  public async removeWebhook(connectId: string): Promise<boolean> {
    try {
      await this._connectApi.deleteConfiguration(this._accountId, connectId)
      return true
    } catch {
      return false
    }
  }

  /** Creates a docusign api client from the oauth parameters */
  public static async create(props: CommonHandlerProps): Promise<DocusignClient> {
    const [oauthState, accountState] = await Promise.all([getOAuthState(props), getAccountState(props)])
    const { account, hasChanged: hasAccountChanged } = accountState

    const apiClient = new DocusignClient({
      accountId: account.id,
      baseUri: account.baseUri,
      accessToken: oauthState.accessToken,
      tokenType: oauthState.tokenType,
    })

    // This side-effect doesn't really belong here, but I can't put
    // it anywhere else without it leading to fragile behaviour.
    if (hasAccountChanged) {
      await refreshWebhooks(props, process.env.BP_WEBHOOK_URL!, apiClient)
    }

    return apiClient
  }
}
