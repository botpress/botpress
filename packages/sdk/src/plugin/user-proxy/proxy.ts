import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'
import type { commonTypes } from '../../common'
import { createAsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BasePlugin } from '../common'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../tag-prefixer'
import type {
  UserFinder,
  ActionableUser,
  BaseActionableUser,
  ActionableUserWithoutConversation,
  ActionableUserWithConversation,
} from './types'

export const proxyUsers = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  pluginAlias?: string
}): UserFinder<TPlugin> => ({
  list(listProps) {
    return createAsyncCollection(({ nextToken }) =>
      props.client
        .listUsers({
          ...prefixTagsIfNeeded(listProps ?? {}, { alias: props.pluginAlias }),
          nextToken,
        })
        .then(({ meta, users }) => ({
          meta,
          items: users.map((user) => proxyUser({ ...props, conversationId: listProps?.conversationId, user })),
        }))
    )
  },

  async getById({ id }) {
    const response = await props.client.getUser({ id })
    return proxyUser({ ...props, user: response.user, conversationId: undefined })
  },
})

export const proxyUser = <TPlugin extends BasePlugin, TConversationId extends string | undefined>(props: {
  client: BotSpecificClient<TPlugin> | client.Client
  conversationId?: TConversationId
  pluginAlias?: string
  user: client.User
}): ActionableUser<TPlugin, TConversationId> => {
  const baseActionableUser = {
    ...(unprefixTagsOwnedByPlugin(props.user, { alias: props.pluginAlias }) as typeUtils.Merge<
      client.User,
      {
        tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['user']['tags']>>
      }
    >),

    async update(data) {
      const { user: updatedUser } = await props.client.updateUser({
        ...prefixTagsIfNeeded(data, { alias: props.pluginAlias }),
        id: props.user.id,
      })

      return proxyUser({ ...props, user: updatedUser })
    },
  } satisfies BaseActionableUser<TPlugin, TConversationId>

  return (
    props.conversationId
      ? ({
          ...baseActionableUser,
          async removeFromConversation() {
            await props.client.removeParticipant({ id: props.conversationId!, userId: props.user.id })

            return proxyUser({
              ...props,
              conversationId: undefined,
            })
          },
        } satisfies ActionableUserWithConversation<TPlugin, TConversationId>)
      : ({
          ...baseActionableUser,
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
