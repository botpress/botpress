import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageTemplateRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageTemplateRenderer.name
  }

  handles(context: VonageContext): boolean {
    return context.payload.type === 'vonage-template'
  }

  async render(context: VonageContext) {
    const payload = context.payload

    context.messages.push({
      content: {
        type: 'template',
        text: undefined,
        template: {
          name: `${payload.namespace}:${payload.name}`,
          parameters: payload.parameters
        }
      },
      whatsapp: { policy: 'deterministic', locale: payload.languageCode || 'en_US' }
    })
  }
}
