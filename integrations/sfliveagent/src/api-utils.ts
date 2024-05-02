import { Conversation } from '@botpress/client'
import { MessageHandlerProps, Client } from './types'

type ListConversations = Client['listConversations']
export const findConversation = async (
  { client }: Pick<MessageHandlerProps, 'client'>,
  arg: Parameters<ListConversations>[0]
): Promise<Conversation | undefined> => {
  const { conversations } = await client.listConversations(arg)
  return conversations[0]
}
