import { Client } from '@botpress/client'
import { z } from 'zod'
import { Cast, Merge } from '../../type-utils'
import { Bot } from '../implementation'
import { EnumerateActions, GetStateByName, IntegrationActionDefinition, IntegrationsOf, ListUserTags } from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

type AsTags<T extends Record<string, string | undefined>> = Cast<T, Record<string, string>>

export type CreateConversation<_TBot extends Bot> = Client['createConversation']
export type GetConversation<_TBot extends Bot> = Client['getConversation']
export type ListConversations<_TBot extends Bot> = Client['listConversations']
export type GetOrCreateConversation<_TBot extends Bot> = Client['getOrCreateConversation']
export type UpdateConversation<_TBot extends Bot> = Client['updateConversation']
export type DeleteConversation<_TBot extends Bot> = Client['deleteConversation']

export type CreateEvent<_TBot extends Bot> = Client['createEvent']
export type GetEvent<_TBot extends Bot> = Client['getEvent']
export type ListEvents<_TBot extends Bot> = Client['listEvents']

export type CreateMessage<_TBot extends Bot> = Client['createMessage']
export type GetOrCreateMessage<_TBot extends Bot> = Client['getOrCreateMessage']
export type GetMessage<_TBot extends Bot> = Client['getMessage']
export type UpdateMessage<_TBot extends Bot> = Client['updateMessage']
export type ListMessages<_TBot extends Bot> = Client['listMessages']
export type DeleteMessage<_TBot extends Bot> = Client['deleteMessage']

export type CreateUser<TBot extends Bot> = <IntegrationName extends IntegrationsOf<TBot['props']>>(
  x: Merge<
    Arg<Client['createUser']>,
    {
      integrationName: Cast<IntegrationName, string>
      tags: AsTags<Partial<Record<ListUserTags<TBot['props'], IntegrationName>, string>>>
    }
  >
) => Res<Client['createUser']>

export type GetUser<_TBot extends Bot> = Client['getUser']

export type ListUsers<TBot extends Bot> = (
  x: Merge<
    Arg<Client['listUsers']>,
    {
      tags: AsTags<Partial<Record<ListUserTags<TBot['props'], null>, string>>>
    }
  >
) => Res<Client['listUsers']>

export type GetOrCreateUser<TBot extends Bot> = <IntegrationName extends IntegrationsOf<TBot['props']>>(
  x: Merge<
    Arg<Client['getOrCreateUser']>,
    {
      integrationName: Cast<IntegrationName, string>
      tags: AsTags<Partial<Record<ListUserTags<TBot['props'], IntegrationName>, string>>>
    }
  >
) => Res<Client['getOrCreateUser']>

export type UpdateUser<TBot extends Bot> = (
  x: Merge<
    Arg<Client['updateUser']>,
    {
      tags: AsTags<Partial<Record<ListUserTags<TBot['props'], null>, string>>>
    }
  >
) => Res<Client['updateUser']>

export type DeleteUser<_TBot extends Bot> = Client['deleteUser']

export type GetState<TBot extends Bot> = <StateName extends keyof TBot['props']['states']>(
  x: Merge<
    Arg<Client['getState']>,
    {
      name: Cast<StateName, string>
      type: GetStateByName<TBot['props'], StateName>['type']
    }
  >
) => Res<Client['getState']>

export type SetState<TBot extends Bot> = <StateName extends keyof TBot['props']['states']>(
  x: Merge<
    Arg<Client['setState']>,
    {
      name: Cast<StateName, string>
      type: GetStateByName<TBot['props'], StateName>['type']
      payload: z.infer<GetStateByName<TBot['props'], StateName>['schema']>
    }
  >
) => Res<Client['setState']>

export type PatchState<TBot extends Bot> = <StateName extends keyof TBot['props']['states']>(
  x: Merge<
    Arg<Client['patchState']>,
    {
      name: Cast<StateName, string>
      type: GetStateByName<TBot['props'], StateName>['type']
      payload: z.infer<GetStateByName<TBot['props'], StateName>['schema']>
    }
  >
) => Res<Client['patchState']>

export type CallAction<TBot extends Bot> = <ActionType extends keyof EnumerateActions<TBot['props']>>(
  x: Merge<
    Arg<Client['callAction']>,
    {
      type: Cast<ActionType, string>
      input: z.infer<Cast<EnumerateActions<TBot['props']>[ActionType], IntegrationActionDefinition>['input']['schema']>
    }
  >
) => Promise<{
  output: z.infer<Cast<EnumerateActions<TBot['props']>[ActionType], IntegrationActionDefinition>['output']['schema']>
}>
