import * as bp from '.botpress'

type CreateMessageArgs = bp.ClientInputs['createMessage']
type RespondArgs = CreateMessageArgs['payload'] & {
  type: CreateMessageArgs['type']
}

export type ApiProps = bp.MessageHandlerProps | bp.EventHandlerProps

export class Api {
  public static from = (args: ApiProps): Api => new Api(args)

  private constructor(private _args: ApiProps) {}

  public async respond(resp: RespondArgs) {
    const { type, ...payload } = resp

    let conversationId: string
    if ('message' in this._args) {
      conversationId = this._args.message.conversationId
    } else {
      conversationId = this._args.event.payload.conversationId
    }

    await this._args.client.createMessage({
      conversationId,
      userId: this._args.ctx.botId,
      tags: {},
      type,
      payload,
    })
  }
}
