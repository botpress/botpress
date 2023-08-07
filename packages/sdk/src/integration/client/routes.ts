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

export type CreateEvent<TIntegration extends Integration<any>> = <TEvent extends keyof Tof<TIntegration>['events']>(
  x: Merge<
    Arg<Client['createEvent']>,
    {
      type: Cast<TEvent, string>
      payload: Tof<TIntegration>['events'][TEvent]['payload']
    }
  >
) => Res<Client['createEvent']>

export type GetEvent<_TIntegration extends Integration<any>> = Client['getEvent']

export type ListEvents<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['listEvents']>,
    {
      type: Cast<keyof Tof<TIntegration>['events'], string>
    }
  >
) => Res<Client['listEvents']>

export type CreateMessage<TIntegration extends Integration<any>> = <
  TChannel extends keyof Tof<TIntegration>['channels'],
  TMessage extends keyof Tof<TIntegration>['channels'][TChannel]['messages']
>(
  x: Merge<
    Arg<Client['createMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: Tof<TIntegration>['channels'][TChannel]['messages'][TMessage]
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['channels'][TChannel]['message']['tags'], string>>>
    }
  >
) => Res<Client['createMessage']>

export type GetOrCreateMessage<TIntegration extends Integration<any>> = <
  TMessage extends keyof Tof<TIntegration>['channels'][string]['messages']
>(
  x: Merge<
    Arg<Client['getOrCreateMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: Tof<TIntegration>['channels'][string]['messages'][TMessage]
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['channels'][string]['message']['tags'], string>>>
    }
  >
) => Res<Client['getOrCreateMessage']>

export type GetMessage<_TIntegration extends Integration<any>> = Client['getMessage']

export type UpdateMessage<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['updateMessage']>,
    {
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['channels'][string]['message']['tags'], string>>>
    }
  >
) => Res<Client['updateMessage']>

export type ListMessages<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['listMessages']>,
    {
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['channels'][string]['message']['tags'], string>>>
    }
  >
) => Res<Client['listMessages']>

export type DeleteMessage<_TIntegration extends Integration<any>> = Client['deleteMessage']

export type CreateUser<TIntegration extends Integration<any>> = (x: {
  tags: AsTags<Partial<Record<keyof Tof<TIntegration>['user']['tags'], string>>>
}) => Res<Client['createUser']>

export type GetUser<_TIntegration extends Integration<any>> = Client['getUser']

export type ListUsers<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['listUsers']>,
    {
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['user']['tags'], string>>>
    }
  >
) => Res<Client['listUsers']>

export type GetOrCreateUser<TIntegration extends Integration<any>> = (x: {
  tags: AsTags<Partial<Record<keyof Tof<TIntegration>['user']['tags'], string>>>
}) => Res<Client['getOrCreateUser']>

export type UpdateUser<TIntegration extends Integration<any>> = (
  x: Merge<
    Arg<Client['updateUser']>,
    {
      tags: AsTags<Partial<Record<keyof Tof<TIntegration>['user']['tags'], string>>>
    }
  >
) => Res<Client['updateUser']>

export type DeleteUser<_TIntegration extends Integration<any>> = Client['deleteUser']

export type GetState<TIntegration extends Integration<any>> = <TState extends keyof Tof<TIntegration>['states']>(
  x: Merge<
    Arg<Client['getState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['getState']>>['state'],
    {
      payload: Tof<TIntegration>['states'][TState]
    }
  >
}>

export type SetState<TIntegration extends Integration<any>> = <TState extends keyof Tof<TIntegration>['states']>(
  x: Merge<
    Arg<Client['setState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
      payload: Tof<TIntegration>['states'][TState]
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['setState']>>['state'],
    {
      payload: Tof<TIntegration>['states'][TState]
    }
  >
}>

export type PatchState<TIntegration extends Integration<any>> = <TState extends keyof Tof<TIntegration>['states']>(
  x: Merge<
    Arg<Client['patchState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
      payload: Partial<Tof<TIntegration>['states'][TState]>
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['patchState']>>['state'],
    {
      payload: Tof<TIntegration>['states'][TState]
    }
  >
}>
