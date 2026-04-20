import { getSuncoClient } from 'src/client'
import { getStoredCredentials } from 'src/get-stored-credentials'
import * as bp from '.botpress'

export const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, input, ctx }) => {
  const credentials = await getStoredCredentials(client, ctx)
  const suncoUser = await getSuncoClient(credentials).getUser(input.user.id)
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
