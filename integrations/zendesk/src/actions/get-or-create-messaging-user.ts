import { RuntimeError } from '@botpress/client'
import { getMessagingClient } from '../messaging-client'
import * as bp from '.botpress'

export const getOrCreateMessagingUser: bp.IntegrationProps['actions']['getOrCreateMessagingUser'] = async ({
  client,
  input,
  ctx,
}) => {
  const messagingClient = getMessagingClient(ctx.configuration)
  if (!messagingClient || !ctx.configuration.messagingAppId) {
    throw new RuntimeError('Messaging client not configured')
  }

  const suncoUser = await messagingClient.users.getUser(ctx.configuration.messagingAppId, input.user.id)
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
