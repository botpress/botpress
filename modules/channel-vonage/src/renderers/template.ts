import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { TemplateComponents, Parameters, Buttons } from '../backend/templates'
import { ChannelContentCustomTemplate, TemplateLanguage, VonageContext } from '../backend/typings'

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
    return context.payload.type === 'template'
  }

  async render(context: VonageContext) {
    const payload = context.payload

    const headerParameters = (payload.header.variables || []) as Parameters
    const bodyParameters = (payload.body.variables || []) as Parameters
    const buttonParameters = (payload.button.variables || []) as Buttons

    const components = new TemplateComponents()
      .withHeader(...headerParameters)
      .withBody(...bodyParameters)
      .withButtons(...buttonParameters)
      .build()

    const language: TemplateLanguage = {
      code: 'en_US', // TODO: Fetch the user language
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

    context.messages.push({ type: 'custom', text: undefined, custom })
  }
}
