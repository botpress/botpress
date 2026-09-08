import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import type { TeamsConfig } from 'definitions'

export class MicrosoftClient {
  private _graphClient: Client

  private constructor(credentials: TeamsConfig) {
    const { tenantId, appId, appPassword } = credentials

    const credential = new ClientSecretCredential(tenantId as string, appId, appPassword)

    this._graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default')
          return token?.token!
        },
      },
    })
  }

  public async getUserByEmail(email: string) {
    try {
      return await this._graphClient.api(`/users/${email}`).get()
    } catch (err: any) {
      if (err.statusCode === 404) {
        throw new Error(`No user found with email: ${email}`)
      }
      throw err
    }
  }

  public static create(credentials: TeamsConfig) {
    return new MicrosoftClient(credentials)
  }
}
