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

// type PagedApiOutput<K extends keyof Actions> =
//   | ErrorResponse
//   | (Omit<ApiOutput<K>, 'paging'> & { nextUrl: string | undefined })

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

  // private _unwrapPagedResponse<K extends keyof Actions>(response: PagedApiOutput<K>): Output<K> {
  //   if ('message' in response) {
  //     throw new RuntimeError(response.message)
  //   }
  //   const { nextUrl, ...result } = response
  //   return {
  //     ...result,
  //     nextUrl,
  //   }
  // }

  private _parsePagedParams<K extends keyof Actions>(
    params: Input<K>
  ): Omit<Input<K>, 'nextToken'> & { page?: number } {
    if (!('nextToken' in params)) {
      return params
    }
    let page: number | undefined = undefined
    if (params.nextToken && !isNaN(Number(params.nextToken))) {
      page = Number(params.nextToken)
    }
    return {
      ...params,
      page,
    }
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

  public async getCandidates(params?: Input<'getCandidates'>): Promise<Output<'getCandidates'>> {
    const response: AxiosResponse<ApiOutput<'getCandidates'>> = await this._client
      .get('/candidates', { params: params })
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }

  public async getCandidate(params: Input<'getCandidate'>): Promise<Output<'getCandidate'>> {
    const response: AxiosResponse<ApiOutput<'getCandidate'>> = await this._client
      .get(`/candidates/${params.id}`)
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }
}
