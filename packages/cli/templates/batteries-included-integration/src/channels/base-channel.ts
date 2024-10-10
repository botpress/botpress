import { ExampleApiClient } from 'src/api-client/api-client'
import { BaseChannelPublisher, ChannelKey, ChannelMessageType } from 'src/lib/channels/base-channel-publisher'

export abstract class BrandedChannelPublisher<
  ChannelName extends ChannelKey,
  MsgType extends ChannelMessageType<ChannelName>
> extends BaseChannelPublisher<ChannelName, MsgType> {
  protected override get _apiFacade(): ExampleApiClient {
    return super._apiFacade as ExampleApiClient
  }
}
