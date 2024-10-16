import { MessageHandlerProps } from './types'

export class ApiUtils {
  public constructor(private readonly _props: MessageHandlerProps) {}
  public readonly respond = async (text: string) => {
    await this._props.client.createMessage({
      type: 'text',
      conversationId: this._props.message.conversationId,
      userId: this._props.ctx.botId,
      tags: {},
      payload: {
        text,
      },
    })
  }
}
