import { Client } from '@botpress/client'
import { Merge, Cast, ValueOf } from '../../type-utils'
import { BaseIntegration } from '../generic'
import { GetChannelByName, ToTags, WithPrefix } from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

type AllChannels<TIntegration extends BaseIntegration> = ValueOf<TIntegration['channels']>

type ConversationResponse<
  TIntegration extends BaseIntegration,
  ChannelName extends keyof TIntegration['channels'] = keyof TIntegration['channels']
> = {
  conversation: Merge<
    Awaited<Res<Client['getConversation']>>['conversation'],
    {
      tags: ToTags<keyof TIntegration['channels'][ChannelName]['conversation']['tags']>
    }
  >
}

export type CreateConversation<TIntegration extends BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: ToTags<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags']>
}) => Promise<ConversationResponse<TIntegration, ChannelName>>

export type GetConversation<TIntegration extends BaseIntegration> = (
  x: Arg<Client['getConversation']>
) => Promise<ConversationResponse<TIntegration>>

export type ListConversations<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listConversations']>,
    {
      tags?: ToTags<keyof AllChannels<TIntegration>['conversation']['tags']>
    }
  >
) => Res<Client['listConversations']> // TODO: response should contain the tags

export type GetOrCreateConversation<TIntegration extends BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: ToTags<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags']>
}) => Promise<ConversationResponse<TIntegration, ChannelName>>

export type UpdateConversation<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateConversation']>,
    {
      tags: ToTags<keyof AllChannels<TIntegration>['conversation']['tags']>
    }
  >
) => Promise<ConversationResponse<TIntegration>>

export type DeleteConversation<_TIntegration extends BaseIntegration> = Client['deleteConversation']

export type ListParticipants<_TIntegration extends BaseIntegration> = Client['listParticipants']
export type AddParticipant<_TIntegration extends BaseIntegration> = Client['addParticipant']
export type GetParticipant<_TIntegration extends BaseIntegration> = Client['getParticipant']
export type RemoveParticipant<_TIntegration extends BaseIntegration> = Client['removeParticipant']

type EventResponse<TIntegration extends BaseIntegration, TEvent extends keyof TIntegration['events']> = {
  event: Merge<
    Awaited<Res<Client['getEvent']>>['event'],
    {
      type: TEvent
      payload: TIntegration['events'][TEvent]
    }
  >
}

export type CreateEvent<TIntegration extends BaseIntegration> = <TEvent extends keyof TIntegration['events']>(
  x: Merge<
    Arg<Client['createEvent']>,
    {
      type: WithPrefix<Cast<TEvent, string>, { allowPrefix: TIntegration['name'] }>
      payload: TIntegration['events'][TEvent]
    }
  >
) => Promise<EventResponse<TIntegration, TEvent>>

export type GetEvent<TIntegration extends BaseIntegration> = (x: Arg<Client['getEvent']>) => Promise<
  ValueOf<{
    [K in keyof TIntegration['events']]: EventResponse<TIntegration, K>
  }>
>

export type ListEvents<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listEvents']>,
    {
      type: WithPrefix<Cast<keyof TIntegration['events'], string>, { allowPrefix: TIntegration['name'] }>
    }
  >
) => Res<Client['listEvents']>

type MessageResponse<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
> = {
  message: Merge<
    Awaited<Res<Client['createMessage']>>['message'],
    {
      payload: TIntegration['channels'][TChannel]['messages'][TMessage]
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags']>
    }
  >
}

export type CreateMessage<TIntegration extends BaseIntegration> = <
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
>(
  x: Merge<
    Arg<Client['createMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: TIntegration['channels'][TChannel]['messages'][TMessage]
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags']>
    }
  >
) => Promise<MessageResponse<TIntegration, TChannel, TMessage>>

export type GetOrCreateMessage<TIntegration extends BaseIntegration> = <
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
>(
  x: Merge<
    Arg<Client['getOrCreateMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: TIntegration['channels'][TChannel]['messages'][TMessage]
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags']>
    }
  >
) => Promise<MessageResponse<TIntegration, TChannel, TMessage>>

export type GetMessage<TIntegration extends BaseIntegration> = (x: Arg<Client['getMessage']>) => Promise<
  // TODO: should return a union of all possible message types like in `GetEvent`
  MessageResponse<TIntegration, keyof TIntegration['channels'], keyof ValueOf<TIntegration['channels']>['messages']>
>

export type UpdateMessage<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateMessage']>,
    {
      tags: ToTags<keyof AllChannels<TIntegration>['message']['tags']>
    }
  >
) => Promise<
  MessageResponse<TIntegration, keyof TIntegration['channels'], keyof ValueOf<TIntegration['channels']>['messages']>
>

export type ListMessages<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listMessages']>,
    {
      tags: ToTags<keyof AllChannels<TIntegration>['message']['tags']>
    }
  >
) => Res<Client['listMessages']> // TODO: response should contain the tags

export type DeleteMessage<_TIntegration extends BaseIntegration> = Client['deleteMessage']

type UserResponse<TIntegration extends BaseIntegration> = {
  user: Merge<
    Awaited<Res<Client['getUser']>>['user'],
    {
      tags: ToTags<keyof TIntegration['user']['tags']>
    }
  >
}

export type CreateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['createUser']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags']>
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
      tags: ToTags<keyof TIntegration['user']['tags']>
    }
  >
) => Res<Client['listUsers']>

export type GetOrCreateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['getOrCreateUser']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags']>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type UpdateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateUser']>,
    {
      tags: ToTags<keyof TIntegration['user']['tags']>
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
      payload: TIntegration['states'][TState] | null
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type GetOrSetState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['getOrSetState']>,
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
