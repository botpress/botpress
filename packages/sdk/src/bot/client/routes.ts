import { Client } from '@botpress/client'
import { Cast, Join, Merge } from '../../type-utils'
import { BaseBot } from '../generic'
import {
  EnumerateActions,
  GetIntegrationByName,
  GetIntegrationChannelByName,
  IntegrationInstanceActionDefinition,
} from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

type AsTags<T extends Record<string, string | undefined>> = Cast<T, Record<string, string>>
type ToTags<TTags extends string | number | symbol> = AsTags<Partial<Record<TTags, string>>>

export type CreateConversation<TBot extends BaseBot> = <
  TIntegrationName extends keyof TBot['integrations'],
  TChannelName extends Cast<keyof GetIntegrationByName<TBot, TIntegrationName>['channels'], string>
>(
  x: Merge<
    Arg<Client['createConversation']>,
    {
      integrationName: Cast<TIntegrationName, string>
      channel: Cast<TChannelName, string>
      tags: ToTags<
        Join<
          [
            TIntegrationName,
            ':',
            keyof GetIntegrationChannelByName<TBot, TIntegrationName, TChannelName>['conversation']['tags']
          ]
        >
      >
    }
  >
) => Res<Client['createConversation']>

export type GetConversation<_TBot extends BaseBot> = Client['getConversation']

export type ListConversations<_TBot extends BaseBot> = Client['listConversations']

export type GetOrCreateConversation<TBot extends BaseBot> = <
  TIntegrationName extends keyof TBot['integrations'],
  TChannelName extends Cast<keyof GetIntegrationByName<TBot, TIntegrationName>['channels'], string>
>(
  x: Merge<
    Arg<Client['getOrCreateConversation']>,
    {
      integrationName: Cast<TIntegrationName, string>
      channel: Cast<TChannelName, string>
      tags: ToTags<
        Join<
          [
            TIntegrationName,
            ':',
            keyof GetIntegrationChannelByName<TBot, TIntegrationName, TChannelName>['conversation']['tags']
          ]
        >
      >
    }
  >
) => Res<Client['getOrCreateConversation']>

export type UpdateConversation<_TBot extends BaseBot> = Client['updateConversation']

export type DeleteConversation<_TBot extends BaseBot> = Client['deleteConversation']

export type ListParticipants<_TBot extends BaseBot> = Client['listParticipants']
export type AddParticipant<_TBot extends BaseBot> = Client['addParticipant']
export type GetParticipant<_TBot extends BaseBot> = Client['getParticipant']
export type RemoveParticipant<_TBot extends BaseBot> = Client['removeParticipant']

export type CreateEvent<_TBot extends BaseBot> = Client['createEvent']
export type GetEvent<_TBot extends BaseBot> = Client['getEvent']
export type ListEvents<_TBot extends BaseBot> = Client['listEvents']

export type CreateMessage<_TBot extends BaseBot> = Client['createMessage']
export type GetOrCreateMessage<_TBot extends BaseBot> = Client['getOrCreateMessage']
export type GetMessage<_TBot extends BaseBot> = Client['getMessage']
export type UpdateMessage<_TBot extends BaseBot> = Client['updateMessage']
export type ListMessages<_TBot extends BaseBot> = Client['listMessages']
export type DeleteMessage<_TBot extends BaseBot> = Client['deleteMessage']

export type CreateUser<_TBot extends BaseBot> = Client['createUser']
export type GetUser<_TBot extends BaseBot> = Client['getUser']
export type ListUsers<_TBot extends BaseBot> = Client['listUsers']
export type GetOrCreateUser<_TBot extends BaseBot> = Client['getOrCreateUser']
export type UpdateUser<_TBot extends BaseBot> = Client['updateUser']
export type DeleteUser<_TBot extends BaseBot> = Client['deleteUser']

export type GetState<TBot extends BaseBot> = <TState extends keyof TBot['states']>(
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
      payload: TBot['states'][TState]
    }
  >
}>

export type SetState<TBot extends BaseBot> = <TState extends keyof TBot['states']>(
  x: Merge<
    Arg<Client['setState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['setState']>>['state'],
    {
      payload: TBot['states'][TState]
    }
  >
}>

export type PatchState<TBot extends BaseBot> = <TState extends keyof TBot['states']>(
  x: Merge<
    Arg<Client['patchState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['patchState']>>['state'],
    {
      payload: TBot['states'][TState]
    }
  >
}>

export type CallAction<TBot extends BaseBot> = <ActionType extends keyof EnumerateActions<TBot>>(
  x: Merge<
    Arg<Client['callAction']>,
    {
      type: Cast<ActionType, string>
      input: Cast<EnumerateActions<TBot>[ActionType], IntegrationInstanceActionDefinition>['input']
    }
  >
) => Promise<{
  output: Cast<EnumerateActions<TBot>[ActionType], IntegrationInstanceActionDefinition>['output']
}>
