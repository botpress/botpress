import { MessageHandlerProps } from '.botpress'

export class Responder {
  public constructor(private _props: MessageHandlerProps) {}

  public static from(props: MessageHandlerProps) {
    return new Responder(props)
  }

  public async respond({ conversationId, text, userId }: { conversationId: string; text: string; userId?: string }) {
    await this._props.client.createMessage({
      conversationId,
      userId: this._props.ctx.botId,
      tags: {},
      type: 'text',
      payload: {
        text,
        userId,
      },
    })
  }
}
