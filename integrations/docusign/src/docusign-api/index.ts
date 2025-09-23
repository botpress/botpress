import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import docusign from 'docusign-esign'
import type { CommonHandlerProps } from '../types'
import { getAccountState, getOAuthState } from './auth-utils'
import { constructWebhookBody, refreshWebhooks } from './utils'

type DocusignClientParams = {
  accountId: string
  baseUri: string
  accessToken: string
  tokenType: string
}

export class DocusignClient {
  private _axiosClient: AxiosInstance
  private _accountId: string

  private constructor(params: DocusignClientParams) {
    const { baseUri, tokenType, accessToken, accountId } = params
    this._accountId = accountId

    this._axiosClient = axios.create({
      baseURL: `${baseUri}/restapi/v2.1`,
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    })
  }

  public async sendEnvelope(envelope: docusign.EnvelopeDefinition) {
    try {
      const resp = await this._axiosClient.post<docusign.EnvelopeSummary>(
        `/accounts/${this._accountId}/envelopes`,
        envelope
      )
      const { data } = resp

      if (!data.envelopeId) {
        const message = data.errorDetails ? data.errorDetails.message : 'Did not receive EnvelopeID from Docusign'
        throw new Error(message)
      }

      return {
        envelopeId: data.envelopeId,
      }
    } catch (thrown: unknown) {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError('Failed to send envelope', err)
    }
  }

  public async listWebhooks(): Promise<docusign.ConnectConfigResults['configurations']> {
    const resp = await this._axiosClient.get<docusign.ConnectConfigResults>(`/accounts/${this._accountId}/connect`)
    return resp.data.configurations
  }

  public async createWebhook(webhookUrl: string, botId: string): Promise<string> {
    try {
      const body = constructWebhookBody(webhookUrl, botId)
      const resp = await this._axiosClient.post<docusign.ConnectCustomConfiguration>(
        `/accounts/${this._accountId}/connect`,
        body
      )

      const { connectId } = resp.data
      if (!connectId) {
        throw new RuntimeError('Failed to create webhook due to unexpected api response')
      }
      return connectId
    } catch (thrown: unknown) {
      if (thrown instanceof RuntimeError) {
        throw thrown
      }

      const error =
        thrown instanceof Error ? new RuntimeError(thrown.message, thrown) : new RuntimeError(String(thrown))
      throw error
    }
  }

  public async removeWebhook(connectId: string): Promise<boolean> {
    try {
      await this._axiosClient.delete(`/accounts/${this._accountId}/connect/${connectId}`)
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
