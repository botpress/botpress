import * as sdk from 'botpress/sdk'

export interface ChannelRenderer<Context extends ChannelContext<any>> {
  id: string
  priority: number
  channel: string

  handles(context: Context): boolean
  render(context: Context): void
}

export interface ChannelSender<Context extends ChannelContext<any>> {
  id: string
  priority: number
  channel: string

  handles(context: Context): boolean
  send(context: Context): Promise<void>
}

export interface ChannelContext<Client> {
  bp: typeof sdk
  event: sdk.IO.OutgoingEvent
  client: Client
  handlers: string[]
  payload: any
  botUrl: string
}
