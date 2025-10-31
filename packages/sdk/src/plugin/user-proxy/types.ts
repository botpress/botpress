import { ClientInputs, User } from '@botpress/client'
import { BasePlugin } from '../common'

export type UserFinder<TPlugin extends BasePlugin> = {
  list: <TConversationId extends string | undefined = undefined>(props: {
    conversationId?: TConversationId
    tags?: ClientInputs['listUsers']['tags']
  }) => Promise<ActionableUser<TPlugin, TConversationId>[]>
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
  update: (props: Omit<ClientInputs['updateUser'], 'id'>) => Promise<ActionableUser<TPlugin, TConversationId>>
}
