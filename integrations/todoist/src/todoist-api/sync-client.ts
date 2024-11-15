import { z, ZodRawShape, ZodObject } from '@botpress/sdk'

export class TodoistSyncClient {
  private readonly _fetch: typeof fetch

  public constructor({ accessToken }: { accessToken: string }) {
    this._fetch = (input, init = {}) => {
      const headers = new Headers(init.headers)
      headers.set('Authorization', `Bearer ${accessToken}`)
      return fetch(input, { ...init, headers })
    }
  }

  public async getAuthenticatedUserId() {
    const { id } = await this._post({ endpoint: 'user', responseSchema: { id: z.string() } })
    return id
  }

  private async _post<T extends ZodRawShape>({
    endpoint,
    body,
    responseSchema,
  }: {
    endpoint: string
    responseSchema: T
    body?: Record<string, any>
  }): Promise<z.infer<ZodObject<T, 'strip'>>> {
    const response = await this._fetch(`https://api.todoist.com/sync/v9/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Failed to send POST request to sync endpoint /${endpoint}: ${response.statusText}`)
    }

    return z.object(responseSchema).parse(await response.json())
  }
}
