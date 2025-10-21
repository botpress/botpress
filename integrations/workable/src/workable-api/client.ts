import { RuntimeError } from '@botpress/client'
import axios, { Axios, AxiosResponse } from 'axios'
// import * as bp from '.botpress'
import { listCandidatesInputSchema, listCandidatesOutputSchema } from 'src/workable-schemas/candidates'
import { z } from '@botpress/sdk'

// type Actions = bp.actions.Actions
// type Input<K extends keyof Actions> = Actions[K]['input']

export type ErrorResponse = {
  code: number
  message: string
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

  public async listCandidates(
    params?: z.infer<typeof listCandidatesInputSchema>
  ): Promise<z.infer<typeof listCandidatesOutputSchema>> {
    const response: AxiosResponse<z.infer<typeof listCandidatesOutputSchema>> = await this._client
      .get('/candidates', { params: params })
      .catch(this._handleAxiosError)
    return this._unwrapResponse(response.data)
  }

  // public async getCandidate(params: Input<'getCandidate'>): Promise<Output<'getCandidate'>> {
  //   const response: AxiosResponse<ApiOutput<'getCandidate'>> = await this._client
  //     .get(`/candidates/${params.id}`)
  //     .catch(this._handleAxiosError)
  //   return this._unwrapResponse(response.data)
  // }
}
