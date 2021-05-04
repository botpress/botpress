import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/client'
import { VonageContext } from '../backend/typings'

export class VonageAudioRenderer implements ChannelRenderer<VonageContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return VonageAudioRenderer.name
  }

  handles(context: VonageContext): boolean {
    return !!context.payload.audio
  }

  async render(context: VonageContext) {
    // TODO : const payload = context.payload as sdk.AudioContent
    const payload = context.payload

    context.messages.push({
      type: 'audio',
      text: undefined,
      audio: {
        url: formatUrl(context.botUrl, payload.audio)
      }
    })
  }
}
