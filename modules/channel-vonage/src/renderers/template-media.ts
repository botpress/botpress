import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import {
  ChannelContentCustomTemplate,
  TemplateLanguage,
  VonageContext,
  Parameters,
  Buttons,
  Components
} from '../backend/typings'

export class VonageMediaTemplateRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageMediaTemplateRenderer.name
  }

  handles(context: VonageContext): boolean {
    return context.payload.type === 'vonage-media-template'
  }

  async render(context: VonageContext) {
    const payload = context.payload

    // TODO: Add support for footers
    const headerParameters = (payload.header?.parameters || []) as Parameters
    const bodyParameters = (payload.body?.parameters || []) as Parameters
    const buttonParameters = (payload.buttons || []) as Buttons
    const languageCode = (payload.languageCode || 'en_US') as string

    const components: Components = []

    if (headerParameters.length) {
      components.push({
        type: 'header',
        parameters: headerParameters
      })
    }

    if (bodyParameters.length) {
      components.push({
        type: 'body',
        parameters: bodyParameters
      })
    }

    if (buttonParameters.length) {
      buttonParameters.forEach((button, index) => {
        components.push({
          type: 'button',
          sub_type: button.subType,
          index,
          parameters: button.parameters
        })
      })
    }

    const language: TemplateLanguage = {
      code: languageCode,
      policy: 'deterministic'
    }
    const custom: ChannelContentCustomTemplate = {
      type: 'template',
      template: {
        namespace: payload.namespace,
        name: payload.name,
        language,
        components
      }
    }

    // TODO: Typings don't work for Media Message Templates
    context.messages.push({
      content: <any>{ type: 'custom', text: undefined, custom }
    })
  }
}
