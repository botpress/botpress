import * as sdk from '@botpress/sdk'
import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'
import { getZendeskClient } from './client'
import * as bp from '.botpress'

class Tags<T extends Record<string, string>> {
  private constructor(private _t: { tags: T }, private _logger: IntegrationLogger) {}

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
  ticket: {
    messages: {
      text: async ({ client, ...props }) => {
        const { text, userId } = props.payload

        const conversationTags = Tags.of(props.conversation, props.logger)
        const conversationRequesterId = conversationTags.find('requesterId')
        const ticketId = conversationTags.get('id')

        let zendeskAuthorId: string
        if (userId) {
          // the bot is sending a message on behalf of another user
          const { user } = await client.getUser({ id: userId })
          const userTags = Tags.of(user, props.logger)
          zendeskAuthorId = userTags.get('id')
        } else if (conversationRequesterId) {
          // the bot is sending a message on behalf of the user who opened the ticket
          zendeskAuthorId = conversationRequesterId
        } else {
          // the bot is sending a message as itself
          const { user } = await client.getUser({ id: props.user.id })
          const userTags = Tags.of(user, props.logger)
          zendeskAuthorId = userTags.get('id')
        }

        return await getZendeskClient(props.ctx.configuration).createComment(ticketId, zendeskAuthorId, text)
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
