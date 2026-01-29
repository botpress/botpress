import { createClient } from '../api/sunshine-api'
import * as bp from '.botpress'

export const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, input, ctx }) => {
  const suncoClient = createClient(ctx.configuration.keyId, ctx.configuration.keySecret)
  const suncoUser = await suncoClient.users.getUser(ctx.configuration.appId, input.user.id)
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
