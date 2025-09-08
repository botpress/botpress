import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import * as bp from '../.botpress'

function getGraphClient({ ctx }: { ctx: bp.Context }) {
  const { tenantId, appId, appPassword } = ctx.configuration

  const credential = new ClientSecretCredential(tenantId as string, appId, appPassword)

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default')
        return token?.token!
      },
    },
  })
}

export async function getUserByEmail(ctx: bp.Context, email: string) {
  try {
    const graphClient = getGraphClient({ ctx })
    return await graphClient.api(`/users/${email}`).get()
  } catch (err: any) {
    if (err.statusCode === 404) {
      throw new Error(`No user found with email: ${email}`)
    }
    throw err
  }
}
