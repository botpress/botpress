import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageLocationRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageLocationRenderer.name
  }

  handles(context: VonageContext): boolean {
    return context.payload.latitude && context.payload.longitude
  }

  async render(context: VonageContext) {
    const payload = context.payload as sdk.LocationContent

    context.messages.push({
      // custom content doesn't have typings
      content: <any>{
        type: 'custom',
        text: undefined,
        custom: {
          type: 'location',
          location: {
            latitude: payload.latitude,
            longitude: payload.longitude,
            name: payload.title,
            address: payload.address
          }
        }
      }
    })
  }
}
