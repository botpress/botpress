import { Conversation } from '@botpress/client'
import { MessageHandlerProps, Client } from './types'

export const respond = async (
  { client, conversationId, ctx }: Pick<MessageHandlerProps, 'client' | 'ctx'> & { conversationId: string },
  text: string
) => {
  await client.createMessage({
    conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text,
    },
  })
}

type ListConversations = Client['listConversations']
export const findConversation = async (
  { client }: Pick<MessageHandlerProps, 'client'>,
  arg: Parameters<ListConversations>[0]
): Promise<Conversation | undefined> => {
  const { conversations } = await client.listConversations(arg)
  return conversations[0]
}
