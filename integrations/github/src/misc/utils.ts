import * as types from './types'
import * as bp from '.botpress'

export const getConversationFromTags = async <E extends keyof types.Channels>(
  client: types.Client,
  tags: Partial<{ channel: E } & Record<keyof bp.channels.Channels[E]['conversation']['tags'], string>>
) => {
  const { conversations } = await client.listConversations({
    tags,
  })

  return conversations.length === 1 ? (conversations[0] ?? null) : null
}
