import * as sdk from '@botpress/sdk'
import * as types from '../types'
import * as bp from '.botpress'

type BotMessage = Pick<bp.ClientInputs['createMessage'], 'type' | 'payload'>

type ErrorHandlerProps = {
  context: string
  conversationId?: string
}

export class BotpressApi {
  private constructor(
    private _client: bp.Client,
    private _botId: string,
    private _logger: sdk.BotLogger
  ) {}

  public static create(props: types.CommonHandlerProps): BotpressApi {
    return new BotpressApi(props.client, props.ctx.botId, props.logger)
  }

  public async respond(conversationId: string, msg: BotMessage): Promise<void> {
    await this._client.createMessage({
      type: msg.type,
      payload: msg.payload,
      conversationId,
      userId: this._botId,
      tags: {},
    })
  }

  public async respondText(conversationId: string, msg: string): Promise<void> {
    return this.respond(conversationId, {
      type: 'text',
      payload: { text: msg },
    })
  }

  public handleError = async (props: ErrorHandlerProps, thrown: unknown): Promise<never> => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    const message = `An error occured while ${props.context}: ${error.message}`
    this._logger.error(message)
    if (props.conversationId) {
      await this.respondText(props.conversationId, message).catch(() => {}) // if this fails, there's nothing we can do
    }
    throw new sdk.RuntimeError(error.message)
  }
}
