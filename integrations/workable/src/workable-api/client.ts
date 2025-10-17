import { RuntimeError } from '@botpress/client'
import axios, { Axios, AxiosResponse } from 'axios'
import * as bp from '.botpress'

type Actions = bp.actions.Actions
type Input<K extends keyof Actions> = Actions[K]['input']

export type ErrorResponse = {
  code: number
  message: string
}

type Output<K extends keyof Actions> = Actions[K]['output']
type ApiOutput<K extends keyof Actions> = Output<K> | ErrorResponse

type PagedApiOutput<K extends keyof Actions> = ErrorResponse | (ApiOutput<K> & { paging: { next: string | undefined } })

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

  private _unwrapPagedResponse<K extends keyof Actions>(response: PagedApiOutput<K>): Output<K> {
    if ('message' in response) {
      throw new RuntimeError(response.message)
    }
    const { paging, ...result } = response
    if (paging?.next) {
      try {
        const url: URL = new URL(paging.next)
        return {
          ...result,
          nextId: url.searchParams.get('since_id'),
          limit: url.searchParams.get('limit'),
        }
      } catch {
        return {
          ...result,
        }
      }
    }
    return response
  }

  private _unwrapResponse<K extends keyof Actions>(response: ApiOutput<K>): Output<K> {
    if ('message' in response) {
      throw new RuntimeError(response.message)
    }

    return response
  }

  private _handleAxiosError(thrown: unknown): never {
    if (axios.isAxiosError(thrown)) {
      throw new RuntimeError(thrown.response?.data?.message || thrown.message)
    } else {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError(error.message)
    }
  }

  public async listCandidates(params?: Input<'listCandidates'>): Promise<Output<'listCandidates'>> {
    const response: AxiosResponse<PagedApiOutput<'listCandidates'>> = await this._client
      .get('/candidates', { params: params })
      .catch(this._handleAxiosError)
    return this._unwrapPagedResponse(response.data)
  }

  public async getCandidate(params: Input<'getCandidate'>): Promise<Output<'getCandidate'>> {
    const response: AxiosResponse<ApiOutput<'getCandidate'>> = await this._client
      .get(`/candidates/${params.id}`)
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }
}
