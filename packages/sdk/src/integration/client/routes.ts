import { Client } from '@botpress/client'
import { Merge, Cast } from '../../type-utils'
import { BaseIntegration } from '../generic'
import { GetChannelByName, ToTags, WithPrefix } from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

type PrefixConfig<TIntegration extends BaseIntegration> = { allowPrefix: TIntegration['name'] }

type AllChannels<TIntegration extends BaseIntegration> = TIntegration['channels'][keyof TIntegration['channels']]

export type CreateConversation<TIntegration extends BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: ToTags<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'], PrefixConfig<TIntegration>>
}) => Res<Client['createConversation']>

export type GetConversation<_TIntegration extends BaseIntegration> = Client['getConversation']

export type ListConversations<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listConversations']>,
    {
      tags?: ToTags<keyof AllChannels<TIntegration>['conversation']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['listConversations']>

export type GetOrCreateConversation<TIntegration extends BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: ToTags<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'], PrefixConfig<TIntegration>>
}) => Res<Client['getOrCreateConversation']>

export type UpdateConversation<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateConversation']>,
    {
      tags: ToTags<keyof AllChannels<TIntegration>['conversation']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['updateConversation']>

export type DeleteConversation<_TIntegration extends BaseIntegration> = Client['deleteConversation']

export type CreateEvent<TIntegration extends BaseIntegration> = <TEvent extends keyof TIntegration['events']>(
  x: Merge<
    Arg<Client['createEvent']>,
    {
      type: WithPrefix<Cast<TEvent, string>, { allowPrefix: TIntegration['name'] }>
      payload: TIntegration['events'][TEvent]['payload']
    }
  >
) => Res<Client['createEvent']>

export type GetEvent<_TIntegration extends BaseIntegration> = Client['getEvent']

export type ListEvents<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listEvents']>,
    {
      type: WithPrefix<Cast<keyof TIntegration['events'], string>, { allowPrefix: TIntegration['name'] }>
    }
  >
) => Res<Client['listEvents']>

export type CreateMessage<TIntegration extends BaseIntegration> = <
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
>(
  x: Merge<
    Arg<Client['createMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: TIntegration['channels'][TChannel]['messages'][TMessage]
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['createMessage']>

export type GetOrCreateMessage<TIntegration extends BaseIntegration> = <
  TMessage extends keyof AllChannels<TIntegration>['messages']
>(
  x: Merge<
    Arg<Client['getOrCreateMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: AllChannels<TIntegration>['messages'][TMessage]
      tags: ToTags<keyof AllChannels<TIntegration>['message']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['getOrCreateMessage']>

export type GetMessage<_TIntegration extends BaseIntegration> = Client['getMessage']

export type UpdateMessage<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateMessage']>,
    {
      tags: ToTags<keyof AllChannels<TIntegration>['message']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['updateMessage']>

export type ListMessages<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listMessages']>,
    {
      tags: ToTags<keyof AllChannels<TIntegration>['message']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['listMessages']>

export type DeleteMessage<_TIntegration extends BaseIntegration> = Client['deleteMessage']

type UserResponse<TIntegration extends BaseIntegration> = {
  user: Merge<
    Awaited<Res<Client['getUser']>>['user'],
    {
      tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
    }
  >
}

export type CreateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['createUser']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type GetUser<TIntegration extends BaseIntegration> = (
  x: Arg<Client['getUser']>
) => Promise<UserResponse<TIntegration>>

export type ListUsers<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listUsers']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Res<Client['listUsers']>

export type GetOrCreateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['getOrCreateUser']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type UpdateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateUser']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type DeleteUser<_TIntegration extends BaseIntegration> = Client['deleteUser']

type StateResponse<TIntegration extends BaseIntegration, TState extends keyof TIntegration['states']> = {
  state: Merge<
    Awaited<Res<Client['getState']>>['state'],
    {
      payload: TIntegration['states'][TState]
    }
  >
}

export type GetState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['getState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type SetState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['setState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
      payload: TIntegration['states'][TState]
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type PatchState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['patchState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
      payload: Partial<TIntegration['states'][TState]>
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type ConfigureIntegration<_TIntegration extends BaseIntegration> = Client['configureIntegration']
