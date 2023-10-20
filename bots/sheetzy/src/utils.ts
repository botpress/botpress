import { MessageHandlerProps } from './types'

export class ApiUtils {
  public constructor(private readonly props: MessageHandlerProps) {}
  public readonly respond = async (text: string) => {
    await this.props.client.createMessage({
      type: 'text',
      conversationId: this.props.message.conversationId,
      userId: this.props.ctx.botId,
      tags: {},
      payload: {
        text,
      },
    })
  }
}
