import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'

export abstract class SlackBaseRenderer implements sdk.ChannelRenderer<SlackContext> {
  getChannel() {
    return 'slack'
  }

  getPriority() {
    return 0
  }

  async handles(context: SlackContext): Promise<boolean> {
    return context.event.type === this.getPayloadType()
  }

  abstract getId()

  abstract getPayloadType(): string

  abstract render(context: SlackContext): Promise<boolean>
}
