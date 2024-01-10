import '@botpress/client'
import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'
import { getZendeskClient } from './client'
import { idTag, requesterIdTag } from './const'
import { IntegrationProps } from '.botpress'

class TagStore<T extends Record<string, string>> {
  constructor(private _t: { tags: T }, private _logger: IntegrationLogger) {}

  public find(key: keyof T) {
    return this._t.tags[key]
  }

  public get(key: keyof T) {
    const value = this.find(key)
    if (!value) {
      const msg = `Could not find tag ${key as string}`
      this._logger.forBot().error(msg)
      throw new Error(`Could not find tag ${key as string}`)
    }
    return value
  }
}

export default {
  ticket: {
    messages: {
      text: async ({ client, ...props }) => {
        const conversationTags = new TagStore(props.conversation, props.logger)
        const ticketId = conversationTags.get(idTag)

        const { user } = await client.getUser({
          id: props.user.id,
        })

        const userTags = new TagStore(user, props.logger)

        const zendeskAuthorId = conversationTags.find(requesterIdTag) ?? userTags.get(idTag)

        return await getZendeskClient(props.ctx.configuration).createComment(
          ticketId,
          zendeskAuthorId,
          props.payload.text
        )
      },
    },
  },
} satisfies IntegrationProps['channels']
