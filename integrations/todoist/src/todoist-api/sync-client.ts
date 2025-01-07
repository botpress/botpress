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

  public async getAuthenticatedUserIdentity() {
    const identity = await this._post({
      endpoint: 'user',
      responseSchema: {
        id: z.string(),
        avatar_medium: z.string(),
        full_name: z.string(),
      },
    })

    return {
      id: identity.id,
      pictureUrl: identity.avatar_medium,
      name: identity.full_name,
    }
  }

  private async _post<T extends ZodRawShape>({
    endpoint,
    params,
    responseSchema,
  }: {
    endpoint: string
    responseSchema: T
    params?: Record<string, any>
  }): Promise<z.infer<ZodObject<T, 'strip'>>> {
    return this._sendRequest({
      endpoint,
      init: {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      responseSchema,
    })
  }

  private async _sendRequest<T extends ZodRawShape>({
    endpoint,
    init,
    responseSchema,
  }: {
    endpoint: string
    init: RequestInit
    responseSchema: T
  }): Promise<z.infer<ZodObject<T, 'strip'>>> {
    const response = await this._fetch(`https://api.todoist.com/sync/v9/${endpoint}`, init)

    if (!response.ok) {
      throw new Error(`Failed to send ${init.method} request to sync endpoint /${endpoint}: ${response.statusText}`)
    }

    return z.object(responseSchema).parse(await response.json())
  }
}
