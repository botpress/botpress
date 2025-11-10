import { ClientInputs, User } from '@botpress/client'
import type { commonTypes } from '../../common'
import type { AsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import { BasePlugin } from '../common'

export type UserFinder<TPlugin extends BasePlugin> = {
  list: <TConversationId extends string | undefined = undefined>(props?: {
    conversationId?: TConversationId
    tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['user']['tags']>>
  }) => AsyncCollection<ActionableUser<TPlugin, TConversationId>>
  getById: (props: { id: string }) => Promise<ActionableUser<TPlugin>>
}

export type ActionableUser<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined = undefined,
> = TConversationId extends string
  ? ActionableUserWithConversation<TPlugin, TConversationId>
  : ActionableUserWithoutConversation<TPlugin, TConversationId>

export type ActionableUserWithConversation<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined,
> = BaseActionableUser<TPlugin, TConversationId> & {
  removeFromConversation: () => Promise<ActionableUser<TPlugin, undefined>>
}

export type ActionableUserWithoutConversation<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined,
> = BaseActionableUser<TPlugin, TConversationId> & {
  addToConversation: <TNewConversationId extends string>(props: {
    conversationId: TNewConversationId
  }) => Promise<ActionableUser<TPlugin, TNewConversationId>>
}

export type BaseActionableUser<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined = undefined,
> = typeUtils.Merge<
  User,
  {
    tags: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['user']['tags']>>
  }
> & {
  update: (
    props: typeUtils.Merge<
      Omit<ClientInputs['updateUser'], 'id'>,
      {
        tags?: commonTypes.ToTags<typeUtils.StringKeys<TPlugin['user']['tags']>>
      }
    >
  ) => Promise<ActionableUser<TPlugin, TConversationId>>
}
