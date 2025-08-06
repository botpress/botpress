import { MessengerClient } from 'messaging-api-messenger'
import { getMessengerClientCredentials } from './auth'
import * as bp from '.botpress'

export async function create(client: bp.Client, ctx: bp.Context): Promise<MessengerClient> {
  const { accessToken, clientId, clientSecret } = await getMessengerClientCredentials(client, ctx)

  return new MessengerClient({
    accessToken,
    appSecret: clientSecret,
    appId: clientId,
  })
}
