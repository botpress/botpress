import { Client } from '@botpress/client'
import { IntegrationImplementation as Integration } from '../implementation'

export type CreateConversation<_TIntegration extends Integration> = Client['createConversation']
export type GetConversation<_TIntegration extends Integration> = Client['getConversation']
export type ListConversations<_TIntegration extends Integration> = Client['listConversations']
export type GetOrCreateConversation<_TIntegration extends Integration> = Client['getOrCreateConversation']
export type UpdateConversation<_TIntegration extends Integration> = Client['updateConversation']
export type DeleteConversation<_TIntegration extends Integration> = Client['deleteConversation']

export type CreateEvent<_TIntegration extends Integration> = Client['createEvent']
export type GetEvent<_TIntegration extends Integration> = Client['getEvent']
export type ListEvents<_TIntegration extends Integration> = Client['listEvents']

export type CreateMessage<_TIntegration extends Integration> = Client['createMessage']
export type GetOrCreateMessage<_TIntegration extends Integration> = Client['getOrCreateMessage']
export type GetMessage<_TIntegration extends Integration> = Client['getMessage']
export type UpdateMessage<_TIntegration extends Integration> = Client['updateMessage']
export type ListMessages<_TIntegration extends Integration> = Client['listMessages']
export type DeleteMessage<_TIntegration extends Integration> = Client['deleteMessage']

export type CreateUser<_TIntegration extends Integration> = Client['createUser']
export type GetUser<_TIntegration extends Integration> = Client['getUser']
export type ListUsers<_TIntegration extends Integration> = Client['listUsers']
export type GetOrCreateUser<_TIntegration extends Integration> = Client['getOrCreateUser']
export type UpdateUser<_TIntegration extends Integration> = Client['updateUser']

export type DeleteUser<_TIntegration extends Integration> = Client['deleteUser']
export type GetState<_TIntegration extends Integration> = Client['getState']

export type SetState<_TIntegration extends Integration> = Client['setState']
export type PatchState<_TIntegration extends Integration> = Client['patchState']
