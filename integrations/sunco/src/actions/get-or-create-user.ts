import { getStoredCredentials } from 'src/get-stored-credentials'
import { createClient } from '../api/sunshine-api'
import * as bp from '.botpress'

export const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, input, ctx }) => {
  const credentials = await getStoredCredentials(client, ctx)
  const suncoClient = createClient(credentials)
  const suncoUser = await suncoClient.users.getUser(credentials.appId, input.user.id)
  const suncoProfile = suncoUser.user?.profile

  const name = input.name ?? [suncoProfile?.givenName, suncoProfile?.surname].join(' ').trim()
  const { user } = await client.getOrCreateUser({
    tags: { id: `${suncoUser.user?.id}` },
    name,
    pictureUrl: input.pictureUrl ?? suncoProfile?.avatarUrl,
  })

  return {
    userId: user.id,
  }
}
