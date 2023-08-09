import { INTEGRATION_NAME } from '../const'
import { Client } from './types'

export const getUserAndConversation = async (
  props: { webchatUserId: string; webchatConvoId: string },
  client: Client
) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: props.webchatConvoId },
  })

  const { user } = await client.getOrCreateUser({ tags: { id: props.webchatUserId } })

  return {
    userId: user.id,
    conversationId: conversation.id,
  }
}

export const getTag = (tags: Record<string, string>, name: string) => {
  return tags[`${INTEGRATION_NAME}:${name}`]
}
