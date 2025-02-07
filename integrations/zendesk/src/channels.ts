import * as sdk from '@botpress/sdk'
import { getZendeskClient } from './client'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

class Tags<T extends Record<string, string>> {
  private constructor(
    private _t: { tags: T },
    private _logger: IntegrationLogger
  ) {}

  public static of<T extends Record<string, string>>(t: { tags: T }, logger: IntegrationLogger) {
    return new Tags(t, logger)
  }

  public find(key: keyof T): string | undefined {
    return this._t.tags[key]
  }

  public get(key: keyof T): string {
    const value = this.find(key)
    if (!value) {
      const msg = `Could not find tag ${key as string}`
      this._logger.forBot().error(msg)
      throw new sdk.RuntimeError(`Could not find tag ${key as string}`)
    }
    return value
  }
}

export default {
  hitl: {
    messages: {
      text: async ({ client, ...props }) => {
        const { text, userId } = props.payload

        const conversationTags = Tags.of(props.conversation, props.logger)
        const ticketId = conversationTags.get('id')

        const bpUserId = userId ?? props.user.id
        const { user } = await client.getUser({ id: bpUserId })
        const userTags = Tags.of(user, props.logger)
        const zendeskAuthorId = userTags.get('id')

        return await getZendeskClient(props.ctx.configuration).createComment(ticketId, zendeskAuthorId, text)
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
