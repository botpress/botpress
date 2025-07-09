import { RuntimeError } from '@botpress/sdk'
import { getMessengerClient } from '../misc/utils'
import * as bp from '.botpress'

const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, ctx, input }) => {
  const userId = input.user.id
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }

  const messengerClient = await getMessengerClient(client, ctx)
  const profile = await messengerClient.getUserProfile(userId)

  const { user } = await client.getOrCreateUser({ tags: { id: profile.id } })

  return {
    userId: user.id,
  }
}

export default getOrCreateUser
