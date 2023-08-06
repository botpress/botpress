import { Client } from '@botpress/client'
import { Merge, Cast } from '../../type-utils'
import { IntegrationImplementation as Integration } from '../implementation'
import { GetChannelByName, Tof } from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>
type AsTags<T extends Record<string, string | undefined>> = Cast<T, Record<string, string>>

export type CreateConversation<TIntegration extends Integration<any>> = <
  ChannelName extends keyof Tof<TIntegration>['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: AsTags<Partial<Record<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'], string>>>
}) => Res<Client['createConversation']>

export type GetConversation<_TIntegration extends Integration<any>> = Client['getConversation']

export type ListConversations<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['listConversations']>,
    {
      tags?: AsTags<Partial<Record<keyof Tof<TIntegration>['channels'][string]['conversation']['tags'], string>>>
    }
  >
) => Res<Client['listConversations']>

export type GetOrCreateConversation<TIntegration extends Integration<any>> = <
  ChannelName extends keyof Tof<TIntegration>['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: AsTags<Partial<Record<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'], string>>>
}) => Res<Client['getOrCreateConversation']>

export type UpdateConversation<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['updateConversation']>,
    {
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['channels'][string]['conversation']['tags'], string>>>
    }
  >
) => Res<Client['updateConversation']>

export type DeleteConversation<_TIntegration extends Integration<any>> = Client['deleteConversation']

export type CreateEvent<_TIntegration extends Integration<any>> = Client['createEvent']
export type GetEvent<_TIntegration extends Integration<any>> = Client['getEvent']
export type ListEvents<_TIntegration extends Integration<any>> = Client['listEvents']

export type CreateMessage<_TIntegration extends Integration<any>> = Client['createMessage']
export type GetOrCreateMessage<_TIntegration extends Integration<any>> = Client['getOrCreateMessage']
export type GetMessage<_TIntegration extends Integration<any>> = Client['getMessage']
export type UpdateMessage<_TIntegration extends Integration<any>> = Client['updateMessage']
export type ListMessages<_TIntegration extends Integration<any>> = Client['listMessages']
export type DeleteMessage<_TIntegration extends Integration<any>> = Client['deleteMessage']

export type CreateUser<_TIntegration extends Integration<any>> = Client['createUser']
export type GetUser<_TIntegration extends Integration<any>> = Client['getUser']
export type ListUsers<_TIntegration extends Integration<any>> = Client['listUsers']
export type GetOrCreateUser<_TIntegration extends Integration<any>> = Client['getOrCreateUser']
export type UpdateUser<_TIntegration extends Integration<any>> = Client['updateUser']

export type DeleteUser<_TIntegration extends Integration<any>> = Client['deleteUser']
export type GetState<_TIntegration extends Integration<any>> = Client['getState']

export type SetState<_TIntegration extends Integration<any>> = Client['setState']
export type PatchState<_TIntegration extends Integration<any>> = Client['patchState']
