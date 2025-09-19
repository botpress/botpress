import { RuntimeError } from '@botpress/sdk'
import docusign from 'docusign-esign'
import type { CommonHandlerProps } from '../types'
import { getAccountState, getOAuthState } from './auth-utils'

type DocusignClientParams = {
  baseUri: string
  accessToken: string
  tokenType: string
}

export class DocusignClient {
  private _apiClient: docusign.ApiClient

  private constructor(params: DocusignClientParams) {
    const { baseUri, tokenType, accessToken } = params

    this._apiClient = new docusign.ApiClient()
    this._apiClient.addDefaultHeader('Authorization', `${tokenType} ${accessToken}`)
    this._apiClient.setBasePath(baseUri)
  }

  // TODO: Use this to implement the sendEnvelope request
  private get _envelopesApi() {
    return new docusign.EnvelopesApi(this._apiClient)
  }

  /** AKA: Webhooks api */
  private get _connectApi() {
    return new docusign.ConnectApi(this._apiClient)
  }

  public async getWebhooksList(accountId: string): Promise<docusign.ConnectConfigResults['configurations']> {
    const resp = await this._connectApi.listConfigurations(accountId)
    return resp.configurations
  }

  public async createWebhook(accountId: string, webhookUrl: string): Promise<string> {
    try {
      const resp = await this._connectApi.createConfiguration(accountId, {
        configurationType: 'custom',
        urlToPublishTo: webhookUrl,
        name: 'Botpress',
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

  public async removeWebhook(accountId: string, connectId: string): Promise<boolean> {
    try {
      await this._connectApi.deleteConfiguration(accountId, connectId)
      return true
    } catch {
      return false
    }
  }

  public async removeAllWebhooksByUrl(accountId: string, webhookUrl: string): Promise<boolean> {
    try {
      const resp = await this.getWebhooksList(accountId)
      const webhookDeletionPromises = resp
        ?.filter((configuration) => configuration.urlToPublishTo === webhookUrl)
        ?.map((webhookToDelete) => {
          return this.removeWebhook(accountId, webhookToDelete.connectId ?? '')
        })

      await Promise.all(webhookDeletionPromises ?? [])
      return true
    } catch {
      return false
    }
  }

  /** Creates a docusign api client from the oauth parameters */
  public static async create(props: CommonHandlerProps): Promise<DocusignClient> {
    const [oauthState, accountState] = await Promise.all([getOAuthState(props), getAccountState(props)])
    return new DocusignClient({
      baseUri: accountState.baseUri,
      accessToken: oauthState.accessToken,
      tokenType: oauthState.tokenType,
    })
  }
}
