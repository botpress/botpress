import { RuntimeError } from '@botpress/sdk'
import { messagingApi as lineMessagingApi } from '@line/bot-sdk'
import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  ctx,
  input,
}) => {
  const usrId = input.conversation.id
  const destId = input.conversation.destinationId
  if (!usrId) {
    throw new RuntimeError('User ID is required')
  }
  if (!destId) {
    throw new RuntimeError('Destination ID is required')
  }

  const lineClient = new lineMessagingApi.MessagingApiClient({
    channelAccessToken: ctx.configuration.channelAccessToken,
  })
  const profile = await lineClient.getProfile(usrId)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { usrId: `${profile.userId}`, destId },
  })

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation
