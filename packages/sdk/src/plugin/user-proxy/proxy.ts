import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'
import type {
  UserFinder,
  ActionableUser,
  BaseActionableUser,
  ActionableUserWithoutConversation,
  ActionableUserWithConversation,
} from './types'
import type { BasePlugin } from '../common'
import { notFoundErrorToUndefined } from 'src/utils/error-utils'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../tag-prefixer'

export const proxyUsers = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  pluginAlias?: string
}): UserFinder<TPlugin> => ({
  async list({ conversationId, tags }) {
    const { users } = await props.client.listUsers({ conversationId, tags })
    return users.map((user) => proxyUser({ ...props, conversationId, user }))
  },

  async getById({ id }) {
    const response = await notFoundErrorToUndefined(props.client.getUser({ id }))
    return response ? proxyUser({ ...props, user: response.user, conversationId: undefined }) : undefined
  },
})

export const proxyUser = <TPlugin extends BasePlugin, TConversationId extends string | undefined>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  conversationId?: TConversationId
  pluginAlias?: string
  user: client.User
}): ActionableUser<TPlugin, TConversationId> => {
  const baseProxy = {
    ...unprefixTagsOwnedByPlugin(props.user, { alias: props.pluginAlias }),

    async update(data) {
      const { user: updatedUser } = await props.client.updateUser({
        id: props.user.id,
        ...prefixTagsIfNeeded(data, { alias: props.pluginAlias }),
      })

      return proxyUser({ ...props, user: updatedUser })
    },
  } satisfies BaseActionableUser<TPlugin, TConversationId>

  return (
    props.conversationId
      ? ({
          ...baseProxy,
          async removeFromConversation() {
            await props.client.removeParticipant({ id: props.conversationId!, userId: props.user.id })

            return proxyUser({
              ...props,
              conversationId: undefined,
            })
          },
        } satisfies ActionableUserWithConversation<TPlugin, TConversationId>)
      : ({
          ...baseProxy,
          async addToConversation({ conversationId }) {
            const { participant } = await props.client.addParticipant({ id: conversationId, userId: props.user.id })

            return proxyUser({
              ...props,
              user: participant,
              conversationId,
            })
          },
        } satisfies ActionableUserWithoutConversation<TPlugin, TConversationId>)
  ) as ActionableUser<TPlugin, TConversationId>
}
