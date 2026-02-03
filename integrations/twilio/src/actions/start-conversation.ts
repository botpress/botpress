import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { getTwilioClient } from '../twilio'

export const startConversation: bp.IntegrationProps['actions']['startConversation'] = async ({
  client,
  ctx,
  input,
}) => {
  const userPhone = input.conversation.userPhone
  const activePhone = input.conversation.activePhone

  if (!activePhone || !activePhone) {
    throw new sdk.RuntimeError('Could not create conversation: missing channel, channelId or userId')
  }

  const twilioClient = getTwilioClient(ctx)
  const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

  const { conversation } = await client.getOrCreateConversation({
    tags: { activePhone, userPhone: phone.phoneNumber },
    channel: 'channel',
  })

  return {
    conversationId: conversation.id,
  }
}
