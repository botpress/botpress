import { Client } from '@botpress/client'
import { Cast, Merge } from '../../type-utils'
import { BaseBot } from '../generic'
import * as types from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

export type CreateConversation<_TBot extends BaseBot> = Client['createConversation']
export type GetConversation<_TBot extends BaseBot> = Client['getConversation']
export type ListConversations<_TBot extends BaseBot> = Client['listConversations']
export type GetOrCreateConversation<_TBot extends BaseBot> = Client['getOrCreateConversation']
export type UpdateConversation<_TBot extends BaseBot> = Client['updateConversation']
export type DeleteConversation<_TBot extends BaseBot> = Client['deleteConversation']

export type ListParticipants<_TBot extends BaseBot> = Client['listParticipants']
export type AddParticipant<_TBot extends BaseBot> = Client['addParticipant']
export type GetParticipant<_TBot extends BaseBot> = Client['getParticipant']
export type RemoveParticipant<_TBot extends BaseBot> = Client['removeParticipant']

export type GetEvent<TBot extends BaseBot> = (x: Arg<Client['getEvent']>) => Promise<types.EventResponse<TBot>>
export type ListEvents<_TBot extends BaseBot> = Client['listEvents'] // TODO: type properly

export type CreateMessage<TBot extends BaseBot> = <TMessage extends keyof types.GetMessages<TBot>>(
  x: Merge<
    Arg<Client['createMessage']>,
    {
      type: Cast<TMessage, string>
      payload: Cast<types.GetMessages<TBot>[TMessage], Record<string, any>>
      // TODO: use bot definiton message property to infer allowed tags (cannot be done until there is a bot.definition.ts file)
    }
  >
) => Promise<types.MessageResponse<TBot, TMessage>>

export type GetOrCreateMessage<TBot extends BaseBot> = <TMessage extends keyof types.GetMessages<TBot>>(
  x: Merge<
    Arg<Client['getOrCreateMessage']>,
    {
      type: Cast<TMessage, string>
      payload: Cast<types.GetMessages<TBot>[TMessage], Record<string, any>>
      // TODO: use bot definiton message property to infer allowed tags (cannot be done until there is a bot.definition.ts file)
    }
  >
) => Promise<types.MessageResponse<TBot, TMessage>>

export type GetMessage<TBot extends BaseBot> = (x: Arg<Client['getMessage']>) => Promise<types.MessageResponse<TBot>>
export type UpdateMessage<TBot extends BaseBot> = (
  x: Arg<Client['updateMessage']>
) => Promise<types.MessageResponse<TBot>>
export type ListMessages<_TBot extends BaseBot> = Client['listMessages'] // TODO: type properly
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
      name: Cast<TState, string> // TODO: use state name to infer state type (cannot be done until there is a bot.definition.ts file)
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
      name: Cast<TState, string> // TODO: use state name to infer state type (cannot be done until there is a bot.definition.ts file)
      payload: TBot['states'][TState]
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

export type GetOrSetState<TBot extends BaseBot> = <TState extends keyof TBot['states']>(
  x: Merge<
    Arg<Client['getOrSetState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type (cannot be done until there is a bot.definition.ts file)
      payload: TBot['states'][TState]
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['getOrSetState']>>['state'],
    {
      payload: TBot['states'][TState]
    }
  >
}>

export type PatchState<TBot extends BaseBot> = <TState extends keyof TBot['states']>(
  x: Merge<
    Arg<Client['patchState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type (cannot be done until there is a bot.definition.ts file)
      payload: Partial<TBot['states'][TState]>
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

export type CallAction<TBot extends BaseBot> = <ActionType extends keyof types.EnumerateActions<TBot>>(
  x: Merge<
    Arg<Client['callAction']>,
    {
      type: Cast<ActionType, string>
      input: Cast<types.EnumerateActions<TBot>[ActionType], types.IntegrationInstanceActionDefinition>['input']
    }
  >
) => Promise<{
  output: Cast<types.EnumerateActions<TBot>[ActionType], types.IntegrationInstanceActionDefinition>['output']
}>
