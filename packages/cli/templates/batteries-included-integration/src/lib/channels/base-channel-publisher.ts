import { RuntimeError } from '@botpress/sdk'
import { BaseApiFacade, ApiFacadeClass } from '../api-client/api-facade'
import * as bp from '.botpress'

type Channels = {
  [K in keyof bp.IntegrationProps['channels']]: bp.IntegrationProps['channels'][K]['messages']
}
export type ChannelProps<Channel extends ChannelKey, MsgType extends ChannelMessageType<Channel>> = Parameters<
  Channels[Channel][MsgType]
>[0]
export type ChannelKey = keyof Channels
export type ChannelMessageType<Channel extends ChannelKey> = keyof Channels[Channel]
export type ChannelPublisherClass = new (
  props: ChannelProps<ChannelKey, ChannelMessageType<ChannelKey>> & { apiFacadeClass?: ApiFacadeClass }
) => BaseChannelPublisher<ChannelKey, ChannelMessageType<ChannelKey>>

export abstract class BaseChannelPublisher<
  ChannelName extends ChannelKey,
  MsgType extends ChannelMessageType<ChannelName>
> {
  protected readonly _ctx: ChannelProps<ChannelName, MsgType>['ctx']
  protected readonly _client: ChannelProps<ChannelName, MsgType>['client']
  protected readonly _logger: ChannelProps<ChannelName, MsgType>['logger']
  protected readonly _name: ChannelProps<ChannelName, MsgType>['type']
  protected readonly _user: ChannelProps<ChannelName, MsgType>['user']
  protected readonly _ack: ChannelProps<ChannelName, MsgType>['ack']
  protected readonly _conversation: ChannelProps<ChannelName, MsgType>['conversation']
  protected readonly _payload: ChannelProps<ChannelName, MsgType>['payload']
  protected readonly _maybeApiFacade?: BaseApiFacade

  public constructor(props: ChannelProps<ChannelName, MsgType> & { apiFacadeClass?: ApiFacadeClass }) {
    this._ctx = props.ctx
    this._client = props.client
    this._logger = props.logger
    this._user = props.user
    this._name = props.type
    this._ack = props.ack
    this._conversation = props.conversation
    this._payload = props.payload
    this._maybeApiFacade = props.apiFacadeClass ? new props.apiFacadeClass(props) : undefined
  }

  public async tryToPublish() {
    try {
      return await this.publish()
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(`${thrown}`)
      throw new RuntimeError(this.getErrorMessage(error))
    }
  }

  protected abstract publish(): Promise<void>
  protected abstract getErrorMessage(originalError: Error): string

  protected get _apiFacade(): BaseApiFacade {
    if (!this._maybeApiFacade) {
      throw new Error('API facade is not available. You should register it in the integration builder.')
    }

    return this._maybeApiFacade
  }
}
