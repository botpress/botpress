import { RuntimeError } from '@botpress/sdk'
import { messagingApi as lineMessagingApi } from '@line/bot-sdk'
import * as bp from '.botpress'

const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, ctx, input }) => {
  const userId = input.user.id
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }

  const lineClient = new lineMessagingApi.MessagingApiClient({
    channelAccessToken: ctx.configuration.channelAccessToken,
  })

  const profile = await lineClient.getProfile(userId)

  const { user } = await client.getOrCreateUser({ tags: { usrId: `${profile.userId}` } })

  return {
    userId: user.id,
  }
}

export default getOrCreateUser
