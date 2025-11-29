import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import * as bp from '.botpress'

export class MicrosoftClient {
  private _graphClient: Client

  private constructor(ctx: bp.Context) {
    const { tenantId, appId, appPassword } = ctx.configuration

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

  public static create(ctx: bp.Context) {
    return new MicrosoftClient(ctx)
  }
}
