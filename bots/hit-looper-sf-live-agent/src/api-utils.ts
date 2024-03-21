import { Conversation } from '@botpress/client'
import { MessageHandlerProps, Client, EventHandlerProps } from './types'

export const mkRespond =
  ({ client, ctx }: MessageHandlerProps | EventHandlerProps) =>
  async ({ conversationId, text }: { conversationId: string; text: string }) => {
    if(conversationId && conversationId.length) {
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
  }

type ListConversations = Client['listConversations']
export const findConversation = async (
  { client }: Pick<MessageHandlerProps, 'client'>,
  arg: Parameters<ListConversations>[0]
): Promise<Conversation | undefined> => {
  const { conversations } = await client.listConversations(arg)
  return conversations[0]
}
