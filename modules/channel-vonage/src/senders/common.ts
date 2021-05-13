import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { MessageApiError, VonageContext } from '../backend/typings'

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
    for (const message of context.messages) {
      context.debug('Sending message', JSON.stringify(message, null, 2))

      await new Promise(resolve => {
        context.client.channel.send(
          { type: 'whatsapp', number: context.event.target },
          {
            type: 'whatsapp',
            number: context.botPhoneNumber
          },
          message,
          (err, data) => {
            if (err) {
              // fixes typings
              const errBody: MessageApiError = (err as any).body
              let reasons: string = ''
              if (errBody) {
                if (errBody.invalid_parameters) {
                  for (const param of errBody.invalid_parameters) {
                    reasons += `${param.reason}: ${param.name}; `
                  }
                }

                context.logger.error(`${errBody.title}: ${errBody.detail} ${reasons}${errBody.type}`)
              } else if ((<any>err).statusCode === '429') {
                context.logger.error('HTTPError (429): Too Many Requests')
              } else {
                context.logger.error('UnknownError', err)
              }
            } else {
              resolve(data)
            }
          }
        )
      })

      if (context.isSandbox) {
        // sandbox is limited to 1 msg / sec
        await Promise.delay(1000)
      }
    }
  }
}
