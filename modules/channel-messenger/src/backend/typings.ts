import { ChannelContext } from 'common/channel'
import { MessengerClient } from './messenger'

export type MessengerContext = ChannelContext<MessengerClient> & {
  messages: any[]
}
