import { MessageHandlerProps } from '.botpress'

export const mkRespond =
  ({ client, ctx }: MessageHandlerProps) =>
  async ({ conversationId, text, userId }: { conversationId: string; text: string; userId?: string }) => {
    await client.createMessage({
      conversationId,
      userId: ctx.botId,
      tags: {},
      type: 'text',
      payload: {
        text,
        userId,
      },
    })
  }
