import { ClientInputs, User } from '@botpress/client'
import { BasePlugin } from '../common'

export type UsersProxy<TPlugin extends BasePlugin> = {
  list: <TConversationId extends string | undefined = undefined>(props: {
    conversationId?: TConversationId
    tags?: ClientInputs['listUsers']['tags']
  }) => Promise<UserProxy<TPlugin, TConversationId>[]>
  getById: (props: { id: string }) => Promise<UserProxy<TPlugin> | undefined>
}

export type UserProxy<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined = undefined,
> = TConversationId extends string
  ? UserProxyWithConversation<TPlugin, TConversationId>
  : UserProxyWithoutConversation<TPlugin, TConversationId>

export type UserProxyWithConversation<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined,
> = BaseUserProxy<TPlugin, TConversationId> & {
  removeFromConversation: () => Promise<UserProxy<TPlugin, undefined>>
}

export type UserProxyWithoutConversation<
  TPlugin extends BasePlugin,
  TConversationId extends string | undefined,
> = BaseUserProxy<TPlugin, TConversationId> & {
  addToConversation: <TNewConversationId extends string>(props: {
    conversationId: TNewConversationId
  }) => Promise<UserProxy<TPlugin, TNewConversationId>>
}

export type BaseUserProxy<TPlugin extends BasePlugin, TConversationId extends string | undefined = undefined> = User & {
  update: (props: Omit<ClientInputs['updateUser'], 'id'>) => Promise<UserProxy<TPlugin, TConversationId>>
}
