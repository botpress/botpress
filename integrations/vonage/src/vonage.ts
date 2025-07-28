import axios from 'axios'
import * as bp from '.botpress'

function getRequestMetadata(conversation: SendMessageProps['conversation']) {
  const channel = conversation.tags?.channel
  const channelId = conversation.tags?.channelId
  const userId = conversation.tags?.userId

  if (!channelId) {
    throw new Error('Invalid channel id')
  }

  if (!userId) {
    throw new Error('Invalid user id')
  }

  if (!channel) {
    throw new Error('Invalid channel')
  }

  return { to: userId, from: channelId, channel }
}

type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'>
export async function sendMessage({ conversation, ctx, ack }: SendMessageProps, payload: any) {
  const { to, from, channel } = getRequestMetadata(conversation)
  const response = await axios.post(
    'https://messages-sandbox.nexmo.com/v1/messages',
    {
      ...payload,
      from,
      to,
      channel,
    },
    {
      headers: { 'Content-Type': 'application/json' },
      auth: { username: ctx.configuration.apiKey, password: ctx.configuration.apiSecret },
    }
  )
  await ack({ tags: { id: response.data.message_uuid } })
}
