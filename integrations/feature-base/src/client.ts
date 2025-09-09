import { RuntimeError } from '@botpress/client'
import axios, { Axios, AxiosResponse } from 'axios'
import { Actions } from '.botpress/implementation/typings/actions'

type Input<K extends keyof Actions> = Actions[K]['input']

export type ErrorResponse = {
  code: number
  message: string
}

type Output<K extends keyof Actions> = Actions[K]['output']
type ApiOutput<K extends keyof Actions> = Output<K> | ErrorResponse

export class FeatureBaseClient {
  private _client: Axios

  public constructor(apiKey: string) {
    this._client = axios.create({
      baseURL: 'https://do.featurebase.app',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    })
  }

  private _handleError<K extends keyof Actions>(response: ApiOutput<K>): Output<K> {
    if ('message' in response) {
      throw new RuntimeError(response.message)
    }

    return response
  }

  public async listBoards(): Promise<Output<'listBoards'>> {
    const response: AxiosResponse<ApiOutput<'listBoards'>> = await this._client.get('/v2/boards')
    return this._handleError(response.data)
  }

  public async getBoard(params: Input<'getBoard'>): Promise<Output<'getBoard'>> {
    const response: AxiosResponse<ApiOutput<'getBoard'>> = await this._client.get(`/v2/boards/${params.id}`)
    return this._handleError(response.data)
  }

  public async listPosts(params: Input<'listPosts'>): Promise<Output<'listPosts'>> {
    const response: AxiosResponse<ApiOutput<'listPosts'>> = await this._client.get('/v2/posts', {
      params,
    })
    return this._handleError(response.data)
  }

  public async createPost(params: Input<'createPost'>): Promise<Output<'createPost'>> {
    const response: AxiosResponse<ApiOutput<'createPost'>> = await this._client.post('/v2/posts', params)
    return this._handleError(response.data)
  }

  public async deletePost(params: Input<'deletePost'>): Promise<Output<'deletePost'>> {
    const response: AxiosResponse<ApiOutput<'deletePost'>> = await this._client.delete('/v2/posts', {
      data: params,
    })
    return this._handleError(response.data)
  }

  public async updatePost(params: Input<'updatePost'>): Promise<Output<'deletePost'>> {
    const response: AxiosResponse<ApiOutput<'updatePost'>> = await this._client.patch('/v2/posts', params)
    return this._handleError(response.data)
  }
}
