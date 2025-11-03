import { ClientInputs, User } from '@botpress/client'
import { BasePlugin } from '../common'
import type { commonTypes } from '../../common'
import type * as typeUtils from '../../utils/type-utils'
import type { AsyncCollection } from '../../utils/api-paging-utils'

export type UserFinder<TPlugin extends BasePlugin> = {
  list: <TConversationId extends string | undefined = undefined>(props: {
    conversationId?: TConversationId
    tags?: commonTypes.ToTags<keyof TPlugin['user']['tags']>
  }) => AsyncCollection<ActionableUser<TPlugin, TConversationId>>
  getById: (props: { id: string }) => Promise<ActionableUser<TPlugin> | undefined>
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
> = User & {
  update: (
    props: typeUtils.Merge<
      Omit<ClientInputs['updateUser'], 'id'>,
      {
        tags?: commonTypes.ToTags<keyof TPlugin['user']['tags']>
      }
    >
  ) => Promise<ActionableUser<TPlugin, TConversationId>>
}
