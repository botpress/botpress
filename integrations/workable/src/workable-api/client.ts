import { z } from '@botpress/sdk'
import axios, { Axios, AxiosResponse } from 'axios'
import {
  getCandidateInputSchema,
  getCandidateOutputSchema,
  listCandidatesInputSchema,
  listCandidatesOutputSchema,
  postCandidateInJobInputSchema,
  postCandidateInJobOutputSchema,
} from 'src/workable-schemas/candidates'
import {
  getWebhooksOutputSchema,
  registerWebhookInputSchema,
  registerWebhookOutputSchema,
} from 'src/workable-schemas/events'

export type ErrorResponse = {
  error: string | undefined
}

type ApiOutput<K extends object> = K | ErrorResponse

export class WorkableClient {
  private _client: Axios

  public constructor(apiToken: string, subDomain: string) {
    this._client = axios.create({
      baseURL: `https://${subDomain}.workable.com/spi/v3`,
      headers: {
        Authorization: 'Bearer ' + apiToken,
        'Content-Type': 'application/json',
      },
    })
  }

  private _unwrapResponse<K extends object>(response: ApiOutput<K>): K {
    if ('error' in response) {
      throw new Error(response.error)
    }
    return response
  }

  private _handleAxiosError(thrown: unknown): never {
    if (axios.isAxiosError(thrown)) {
      throw new Error(thrown.response?.data?.message || thrown.message)
    }
    throw thrown
  }

  public async unregisterWebhook(id: number): Promise<void> {
    await this._client.delete(`/subscriptions/${id}`).catch(this._handleAxiosError)
  }

  public async registerWebhook(
    params: z.infer<typeof registerWebhookInputSchema>
  ): Promise<z.infer<typeof registerWebhookOutputSchema>> {
    const response: AxiosResponse<z.infer<typeof registerWebhookOutputSchema>> = await this._client
      .post('/subscriptions', params)
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }

  public async getWebhooks(): Promise<z.infer<typeof getWebhooksOutputSchema>> {
    const response: AxiosResponse<z.infer<typeof getWebhooksOutputSchema>> = await this._client
      .get('/subscriptions')
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }

  public async listCandidates(
    params?: z.infer<typeof listCandidatesInputSchema>
  ): Promise<z.infer<typeof listCandidatesOutputSchema>> {
    const response: AxiosResponse<z.infer<typeof listCandidatesOutputSchema>> = await this._client
      .get('/candidates', { params })
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }

  public async getCandidate(
    params: z.infer<typeof getCandidateInputSchema>
  ): Promise<z.infer<typeof getCandidateOutputSchema>> {
    const response: AxiosResponse<z.infer<typeof getCandidateOutputSchema>> = await this._client
      .get(`/candidates/${params.id}`)
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }

  public async postCandidate(
    params: z.infer<typeof postCandidateInJobInputSchema>
  ): Promise<z.infer<typeof postCandidateInJobOutputSchema>> {
    const response: AxiosResponse<z.infer<typeof postCandidateInJobOutputSchema>> = await this._client
      .post(`/jobs/${params.shortCode}/candidates`, params.body)
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }
}
