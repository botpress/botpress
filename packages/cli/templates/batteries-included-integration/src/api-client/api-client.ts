import axios from 'axios'
import { BaseApiFacade } from 'src/lib/api-client/api-facade'

export class ExampleApiClient extends BaseApiFacade {
  public async getPosts() {
    const client = this._getClient()

    return client.get('/posts')
  }

  public async addPost({ title, body }: { title: string; body: string }) {
    const client = this._getClient()

    return client.post('/posts', { title, body })
  }

  private _getClient() {
    return axios.create({
      baseURL: 'https://jsonplaceholder.typicode.com',
      headers: {
        Authorization: `Bearer ${this._ctx.configuration.fieldName}`,
      },
    })
  }
}
