import * as client from '@botpress/client'
import * as utils from '../../utils/type-utils'
import * as common from '../common'
import {
  EnumerateMessages,
  ConversationTags,
  GetChannelByName,
  GetMessageByName,
  MessageTags,
  WithRequiredPrefix,
  TagsOfMessage,
} from './sub-types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

type ConversationResponse<
  TIntegration extends common.BaseIntegration,
  ChannelName extends keyof TIntegration['channels'] = keyof TIntegration['channels'],
> = {
  conversation: utils.Merge<
    Awaited<Res<client.Client['getConversation']>>['conversation'],
    {
      channel: ChannelName
      tags: common.ToTags<keyof TIntegration['channels'][ChannelName]['conversation']['tags']>
    }
  >
}

export type CreateConversation<TIntegration extends common.BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels'],
>(x: {
  channel: utils.Cast<ChannelName, string>
  tags: common.ToTags<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags']>
}) => Promise<ConversationResponse<TIntegration, ChannelName>>

export type GetConversation<TIntegration extends common.BaseIntegration> = (
  x: Arg<client.Client['getConversation']>
) => Promise<ConversationResponse<TIntegration>>

export type ListConversations<TIntegration extends common.BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels'],
>(
  x: utils.Merge<
    Arg<client.Client['listConversations']>,
    {
      channel?: utils.Cast<ChannelName, string>
      tags?: common.ToTags<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags']>
    }
  >
) => Res<client.Client['listConversations']> // TODO: response should contain the tags

export type GetOrCreateConversation<TIntegration extends common.BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels'],
  TTags extends keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'],
>(
  x: utils.Merge<
    Arg<client.Client['getOrCreateConversation']>,
    {
      channel: utils.Cast<ChannelName, string>
      tags: common.ToTags<TTags>
      discriminateByTags?: NoInfer<utils.Cast<TTags[], string[]>>
    }
  >
) => Promise<ConversationResponse<TIntegration, ChannelName>>

export type UpdateConversation<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['updateConversation']>,
    {
      tags?: common.ToTags<ConversationTags<TIntegration>>
    }
  >
) => Promise<ConversationResponse<TIntegration>>

export type DeleteConversation<_TIntegration extends common.BaseIntegration> = client.Client['deleteConversation']

export type ListParticipants<_TIntegration extends common.BaseIntegration> = client.Client['listParticipants']
export type AddParticipant<_TIntegration extends common.BaseIntegration> = client.Client['addParticipant']
export type GetParticipant<_TIntegration extends common.BaseIntegration> = client.Client['getParticipant']
export type RemoveParticipant<_TIntegration extends common.BaseIntegration> = client.Client['removeParticipant']

type EventResponse<TIntegration extends common.BaseIntegration, TEvent extends keyof TIntegration['events']> = {
  event: utils.Merge<
    Awaited<Res<client.Client['getEvent']>>['event'],
    {
      type: WithRequiredPrefix<utils.Cast<TEvent, string>, TIntegration['name']>
      payload: TIntegration['events'][TEvent]
    }
  >
}

export type CreateEvent<TIntegration extends common.BaseIntegration> = <TEvent extends keyof TIntegration['events']>(
  x: utils.Merge<
    Arg<client.Client['createEvent']>,
    {
      type: utils.Cast<TEvent, string>
      payload: TIntegration['events'][TEvent]
    }
  >
) => Promise<EventResponse<TIntegration, TEvent>>

export type GetEvent<TIntegration extends common.BaseIntegration> = (x: Arg<client.Client['getEvent']>) => Promise<
  utils.ValueOf<{
    [K in keyof TIntegration['events']]: EventResponse<TIntegration, K>
  }>
>

export type ListEvents<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['listEvents']>,
    {
      type?: WithRequiredPrefix<utils.Cast<keyof TIntegration['events'], string>, TIntegration['name']>
    }
  >
) => Res<client.Client['listEvents']>

type MessageResponse<
  TIntegration extends common.BaseIntegration,
  TMessage extends keyof EnumerateMessages<TIntegration> = keyof EnumerateMessages<TIntegration>,
> = {
  message: utils.Merge<
    Awaited<Res<client.Client['createMessage']>>['message'],
    {
      type: utils.Cast<TMessage, string>
      payload: GetMessageByName<TIntegration, TMessage>['payload']
      tags: common.ToTags<TagsOfMessage<TIntegration, TMessage>>
    }
  >
}

export type CreateMessage<TIntegration extends common.BaseIntegration> = <
  TMessage extends keyof EnumerateMessages<TIntegration>,
>(
  x: utils.Merge<
    Arg<client.Client['createMessage']>,
    {
      type: utils.Cast<TMessage, string>
      payload: GetMessageByName<TIntegration, TMessage>['payload']
      tags: common.ToTags<keyof GetMessageByName<TIntegration, TMessage>['tags']>
    }
  >
) => Promise<MessageResponse<TIntegration, TMessage>>

export type GetOrCreateMessage<TIntegration extends common.BaseIntegration> = <
  TMessage extends keyof EnumerateMessages<TIntegration>,
  TTags extends keyof GetMessageByName<TIntegration, TMessage>['tags'],
>(
  x: utils.Merge<
    Arg<client.Client['getOrCreateMessage']>,
    {
      type: utils.Cast<TMessage, string>
      payload: GetMessageByName<TIntegration, TMessage>['payload']
      tags: common.ToTags<TTags>
      // TODO: find a way to restrict discriminateByTags to tags present in x.tags
      discriminateByTags?: NoInfer<utils.Cast<TTags[], string[]>>
    }
  >
) => Promise<MessageResponse<TIntegration, TMessage>>

export type GetMessage<TIntegration extends common.BaseIntegration> = (
  x: Arg<client.Client['getMessage']>
) => Promise<MessageResponse<TIntegration>>

export type UpdateMessage<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['updateMessage']>,
    {
      tags: common.ToTags<MessageTags<TIntegration>>
    }
  >
) => Promise<MessageResponse<TIntegration>>

export type ListMessages<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['listMessages']>,
    {
      tags?: common.ToTags<MessageTags<TIntegration>>
    }
  >
) => Res<client.Client['listMessages']> // TODO: response should contain the tags

export type DeleteMessage<_TIntegration extends common.BaseIntegration> = client.Client['deleteMessage']

type UserResponse<TIntegration extends common.BaseIntegration> = {
  user: utils.Merge<
    Awaited<Res<client.Client['getUser']>>['user'],
    {
      tags: common.ToTags<keyof TIntegration['user']['tags']>
    }
  >
}

export type CreateUser<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['createUser']>,
    {
      tags: common.ToTags<keyof TIntegration['user']['tags']>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type GetUser<TIntegration extends common.BaseIntegration> = (
  x: Arg<client.Client['getUser']>
) => Promise<UserResponse<TIntegration>>

export type ListUsers<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['listUsers']>,
    {
      tags?: common.ToTags<keyof TIntegration['user']['tags']>
    }
  >
) => Res<client.Client['listUsers']>

export type GetOrCreateUser<TIntegration extends common.BaseIntegration> = <
  TTags extends keyof TIntegration['user']['tags'],
>(
  x: utils.Merge<
    Arg<client.Client['getOrCreateUser']>,
    {
      tags: common.ToTags<TTags>
      discriminateByTags?: NoInfer<utils.Cast<TTags[], string[]>>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type UpdateUser<TIntegration extends common.BaseIntegration> = (
  x: utils.Merge<
    Arg<client.Client['updateUser']>,
    {
      tags?: common.ToTags<keyof TIntegration['user']['tags']>
    }
  >
) => Promise<UserResponse<TIntegration>>

export type DeleteUser<_TIntegration extends common.BaseIntegration> = client.Client['deleteUser']

type StateResponse<TIntegration extends common.BaseIntegration, TState extends keyof TIntegration['states']> = {
  state: utils.Merge<
    Awaited<Res<client.Client['getState']>>['state'],
    {
      name: utils.Cast<TState, string>
      type: utils.Cast<TIntegration['states'][TState]['type'], string>
      payload: TIntegration['states'][TState]['payload']
    }
  >
  meta: {
    cached: boolean
  }
}

export type GetState<TIntegration extends common.BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: utils.Merge<
    Arg<client.Client['getState']>,
    {
      type: utils.Cast<TIntegration['states'][TState]['type'], string>
      name: utils.Cast<TState, string>
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type SetState<TIntegration extends common.BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: utils.Merge<
    Arg<client.Client['setState']>,
    {
      name: utils.Cast<TState, string>
      type: utils.Cast<TIntegration['states'][TState]['type'], string>
      payload: TIntegration['states'][TState]['payload'] | null
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type GetOrSetState<TIntegration extends common.BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: utils.Merge<
    Arg<client.Client['getOrSetState']>,
    {
      name: utils.Cast<TState, string>
      type: utils.Cast<TIntegration['states'][TState]['type'], string>
      payload: TIntegration['states'][TState]['payload']
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type PatchState<TIntegration extends common.BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: utils.Merge<
    Arg<client.Client['patchState']>,
    {
      name: utils.Cast<TState, string>
      type: utils.Cast<TIntegration['states'][TState]['type'], string>
      payload: Partial<TIntegration['states'][TState]['payload']>
    }
  >
) => Promise<StateResponse<TIntegration, TState>>

export type ConfigureIntegration<_TIntegration extends common.BaseIntegration> = client.Client['configureIntegration']

export type UploadFile<_TIntegration extends common.BaseIntegration> = client.Client['uploadFile']
export type UpsertFile<_TIntegration extends common.BaseIntegration> = client.Client['upsertFile']
export type DeleteFile<_TIntegration extends common.BaseIntegration> = client.Client['deleteFile']
export type ListFiles<_TIntegration extends common.BaseIntegration> = client.Client['listFiles']
export type GetFile<_TIntegration extends common.BaseIntegration> = client.Client['getFile']
export type UpdateFileMetadata<_TIntegration extends common.BaseIntegration> = client.Client['updateFileMetadata']

export type ClientOperations<TIntegration extends common.BaseIntegration> = {
  createConversation: CreateConversation<TIntegration>
  getConversation: GetConversation<TIntegration>
  listConversations: ListConversations<TIntegration>
  getOrCreateConversation: GetOrCreateConversation<TIntegration>
  updateConversation: UpdateConversation<TIntegration>
  deleteConversation: DeleteConversation<TIntegration>
  listParticipants: ListParticipants<TIntegration>
  addParticipant: AddParticipant<TIntegration>
  getParticipant: GetParticipant<TIntegration>
  removeParticipant: RemoveParticipant<TIntegration>
  createEvent: CreateEvent<TIntegration>
  getEvent: GetEvent<TIntegration>
  listEvents: ListEvents<TIntegration>
  createMessage: CreateMessage<TIntegration>
  getOrCreateMessage: GetOrCreateMessage<TIntegration>
  getMessage: GetMessage<TIntegration>
  updateMessage: UpdateMessage<TIntegration>
  listMessages: ListMessages<TIntegration>
  deleteMessage: DeleteMessage<TIntegration>
  createUser: CreateUser<TIntegration>
  getUser: GetUser<TIntegration>
  listUsers: ListUsers<TIntegration>
  getOrCreateUser: GetOrCreateUser<TIntegration>
  updateUser: UpdateUser<TIntegration>
  deleteUser: DeleteUser<TIntegration>
  getState: GetState<TIntegration>
  setState: SetState<TIntegration>
  getOrSetState: GetOrSetState<TIntegration>
  patchState: PatchState<TIntegration>
  configureIntegration: ConfigureIntegration<TIntegration>
  uploadFile: UploadFile<TIntegration>
  upsertFile: UpsertFile<TIntegration>
  deleteFile: DeleteFile<TIntegration>
  listFiles: ListFiles<TIntegration>
  getFile: GetFile<TIntegration>
  updateFileMetadata: UpdateFileMetadata<TIntegration>
}

export type ClientInputs<TIntegration extends common.BaseIntegration> = {
  [K in keyof ClientOperations<TIntegration>]: Arg<ClientOperations<TIntegration>[K]>
}

export type ClientOutputs<TIntegration extends common.BaseIntegration> = {
  [K in keyof ClientOperations<TIntegration>]: Awaited<Res<ClientOperations<TIntegration>[K]>>
}
