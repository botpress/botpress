import { ChannelMessage } from '@vonage/server-sdk'
import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageCommonSender implements ChannelSender<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageCommonSender.name
  }

  handles(context: VonageContext): boolean {
    return context.handlers.length > 0
  }

  async send(context: VonageContext) {
    for (const content of context.messages) {
      const message: ChannelMessage = {
        content
      }

      await new Promise(resolve => {
        context.client.channel.send(
          { type: 'whatsapp', number: context.event.target },
          {
            type: 'whatsapp',
            number: context.botPhoneNumber
          },
          message,
          (err, data) => {
            resolve(data)
          }
        )
      })

      // TODO : put delay here because of garbage limitations with sandbox
    }
  }
}
