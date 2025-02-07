import * as client from '@botpress/client'
import * as utils from '../../utils/type-utils'
import * as common from '../types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>

type EventResponse<TBot extends common.BaseBot> = {
  event: {
    [K in keyof common.EnumerateEvents<TBot>]: utils.Merge<
      client.Event,
      { type: K; payload: common.EnumerateEvents<TBot>[K] }
    >
  }[keyof common.EnumerateEvents<TBot>]
}

type MessageResponse<
  TBot extends common.BaseBot,
  TMessage extends keyof common.GetMessages<TBot> = keyof common.GetMessages<TBot>,
> = {
  // TODO: use bot definiton message property to infer allowed tags
  message: utils.ValueOf<{
    [K in keyof common.GetMessages<TBot> as K extends TMessage ? K : never]: utils.Merge<
      client.Message,
      { type: K; payload: common.GetMessages<TBot>[K] }
    >
  }>
}

type StateResponse<
  TBot extends common.BaseBot,
  TState extends keyof TBot['states'] = keyof TBot['states'],
> = utils.Merge<
  Awaited<Res<client.Client['getState']>>,
  {
    state: utils.Merge<
      Awaited<Res<client.Client['getState']>>['state'],
      {
        payload: TBot['states'][TState]
      }
    >
  }
>

export type CreateConversation<_TBot extends common.BaseBot> = client.Client['createConversation']
export type GetConversation<_TBot extends common.BaseBot> = client.Client['getConversation']
export type ListConversations<_TBot extends common.BaseBot> = client.Client['listConversations']
export type GetOrCreateConversation<_TBot extends common.BaseBot> = client.Client['getOrCreateConversation']
export type UpdateConversation<_TBot extends common.BaseBot> = client.Client['updateConversation']
export type DeleteConversation<_TBot extends common.BaseBot> = client.Client['deleteConversation']

export type ListParticipants<_TBot extends common.BaseBot> = client.Client['listParticipants']
export type AddParticipant<_TBot extends common.BaseBot> = client.Client['addParticipant']
export type GetParticipant<_TBot extends common.BaseBot> = client.Client['getParticipant']
export type RemoveParticipant<_TBot extends common.BaseBot> = client.Client['removeParticipant']

export type GetEvent<TBot extends common.BaseBot> = (x: Arg<client.Client['getEvent']>) => Promise<EventResponse<TBot>>
export type ListEvents<_TBot extends common.BaseBot> = client.Client['listEvents'] // TODO: type properly

export type CreateMessage<TBot extends common.BaseBot> = <TMessage extends keyof common.GetMessages<TBot>>(
  x: utils.Merge<
    Arg<client.Client['createMessage']>,
    {
      type: utils.Cast<TMessage, string>
      payload: utils.Cast<common.GetMessages<TBot>[TMessage], Record<string, any>>
      // TODO: use bot definiton message property to infer allowed tags
    }
  >
) => Promise<MessageResponse<TBot, TMessage>>

export type GetOrCreateMessage<TBot extends common.BaseBot> = <TMessage extends keyof common.GetMessages<TBot>>(
  x: utils.Merge<
    Arg<client.Client['getOrCreateMessage']>,
    {
      type: utils.Cast<TMessage, string>
      payload: utils.Cast<common.GetMessages<TBot>[TMessage], Record<string, any>>
      // TODO: use bot definiton message property to infer allowed tags
    }
  >
) => Promise<MessageResponse<TBot, TMessage>>

export type GetMessage<TBot extends common.BaseBot> = (
  x: Arg<client.Client['getMessage']>
) => Promise<MessageResponse<TBot>>
export type UpdateMessage<TBot extends common.BaseBot> = (
  x: Arg<client.Client['updateMessage']>
) => Promise<MessageResponse<TBot>>
export type ListMessages<_TBot extends common.BaseBot> = client.Client['listMessages'] // TODO: type properly
export type DeleteMessage<_TBot extends common.BaseBot> = client.Client['deleteMessage']

export type CreateUser<_TBot extends common.BaseBot> = client.Client['createUser']
export type GetUser<_TBot extends common.BaseBot> = client.Client['getUser']
export type ListUsers<_TBot extends common.BaseBot> = client.Client['listUsers']
export type GetOrCreateUser<_TBot extends common.BaseBot> = client.Client['getOrCreateUser']
export type UpdateUser<_TBot extends common.BaseBot> = client.Client['updateUser']
export type DeleteUser<_TBot extends common.BaseBot> = client.Client['deleteUser']

export type GetState<TBot extends common.BaseBot> = <TState extends keyof TBot['states']>(
  x: utils.Merge<
    Arg<client.Client['getState']>,
    {
      name: utils.Cast<TState, string> // TODO: use state name to infer state type
    }
  >
) => Promise<StateResponse<TBot, TState>>

export type SetState<TBot extends common.BaseBot> = <TState extends keyof TBot['states']>(
  x: utils.Merge<
    Arg<client.Client['setState']>,
    {
      name: utils.Cast<TState, string> // TODO: use state name to infer state type
      payload: TBot['states'][TState] | null
    }
  >
) => Promise<StateResponse<TBot, TState>>

export type GetOrSetState<TBot extends common.BaseBot> = <TState extends keyof TBot['states']>(
  x: utils.Merge<
    Arg<client.Client['getOrSetState']>,
    {
      name: utils.Cast<TState, string> // TODO: use state name to infer state type
      payload: TBot['states'][TState]
    }
  >
) => Promise<StateResponse<TBot, TState>>

export type PatchState<TBot extends common.BaseBot> = <TState extends keyof TBot['states']>(
  x: utils.Merge<
    Arg<client.Client['patchState']>,
    {
      name: utils.Cast<TState, string> // TODO: use state name to infer state type
      payload: Partial<TBot['states'][TState]>
    }
  >
) => Promise<{
  state: utils.Merge<
    Awaited<Res<client.Client['patchState']>>['state'],
    {
      payload: TBot['states'][TState]
    }
  >
}>

export type CallAction<TBot extends common.BaseBot> = <ActionType extends keyof common.EnumerateActions<TBot>>(
  x: utils.Merge<
    Arg<client.Client['callAction']>,
    {
      type: utils.Cast<ActionType, string>
      input: utils.Cast<common.EnumerateActions<TBot>[ActionType], common.IntegrationInstanceActionDefinition>['input']
    }
  >
) => Promise<
  utils.Merge<
    Awaited<Res<client.Client['callAction']>>,
    {
      output: utils.Cast<
        common.EnumerateActions<TBot>[ActionType],
        common.IntegrationInstanceActionDefinition
      >['output']
    }
  >
>

export type UploadFile<_TBot extends common.BaseBot> = client.Client['uploadFile']
export type UpsertFile<_TBot extends common.BaseBot> = client.Client['upsertFile']
export type DeleteFile<_TBot extends common.BaseBot> = client.Client['deleteFile']
export type ListFiles<_TBot extends common.BaseBot> = client.Client['listFiles']
export type GetFile<_TBot extends common.BaseBot> = client.Client['getFile']
export type UpdateFileMetadata<_TBot extends common.BaseBot> = client.Client['updateFileMetadata']
export type SearchFiles<_TBot extends common.BaseBot> = client.Client['searchFiles']

export type GetTableRow<TBot extends common.BaseBot> = <
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>>,
>(
  x: utils.Merge<
    Arg<client.Client['getTableRow']>,
    {
      table: utils.Cast<TableName, string>
      id: client.Row['id']
    }
  >
) => Promise<
  Readonly<
    utils.Merge<
      Awaited<Res<client.Client['getTableRow']>>,
      {
        row: Awaited<Res<client.Client['getTableRow']>>['row'] & Columns
      }
    >
  >
>
export type CreateTableRows<TBot extends common.BaseBot> = <
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>>,
>(
  x: utils.Merge<
    Arg<client.Client['createTableRows']>,
    {
      table: utils.Cast<TableName, string>
      rows: utils.AtLeastOne<utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>>>
    }
  >
) => Promise<
  Readonly<
    utils.Merge<
      Awaited<Res<client.Client['createTableRows']>>,
      {
        rows: Awaited<Res<client.Client['createTableRows']>>['rows'] & Columns[]
      }
    >
  >
>

// FIXME: The table row filters are defined in @bpinternal/tables-api, but
//        they're not exported, so we have to redefine them here. Ideally, we
//        should have a single source of truth for these types.

type TableRowQueryGroup = 'key' | 'avg' | 'max' | 'min' | 'sum' | 'count'

type TableRowExtraColumns = {
  /**
   * Unique identifier for the row.
   */
  id: number
  /**
   * Timestamp of row creation.
   */
  createdAt: string
  /**
   * Timestamp of the last row update.
   */
  updatedAt: string
}

type TableRowFilter<
  TBot extends common.BaseBot,
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>> & TableRowExtraColumns,
> = TableRowColumnFilters<Columns> | TableRowLogicalFilter<TBot, TableName, Columns>

type TableRowColumnFilters<Columns> = utils.AtLeastOneProperty<{
  [K in Extract<keyof Columns, string>]: TableColumnComparisonFilter<Columns[K]>
}>

type TableRowLogicalFilter<
  TBot extends common.BaseBot,
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>> & TableRowExtraColumns,
> = utils.ExactlyOneProperty<{
  $and: utils.AtLeastOne<TableRowFilter<TBot, TableName, Columns>>
  $or: utils.AtLeastOne<TableRowFilter<TBot, TableName, Columns>>
  $not: TableRowColumnFilters<Columns>
}>

type TableColumnComparisonFilter<ColumnType> =
  | ColumnType
  | utils.ExactlyOneProperty<{
      $eq: ColumnType
      $gt: ColumnType
      $gte: ColumnType
      $lt: ColumnType
      $lte: ColumnType
      $ne: ColumnType
      $mod: [number, number]
      $in: utils.AtLeastOne<ColumnType>
      $nin: utils.AtLeastOne<ColumnType>
      $exists: boolean
      $size: number
    }>

export type FindTableRows<TBot extends common.BaseBot> = <
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>> & TableRowExtraColumns,
>(
  x: utils.Merge<
    Arg<client.Client['findTableRows']>,
    {
      table: utils.Cast<TableName, string>
      filter?: TableRowFilter<TBot, TableName, Columns>
      group?: utils.AtLeastOneProperty<{
        [K in Extract<keyof Columns, string>]: TableRowQueryGroup | TableRowQueryGroup[]
      }>
      orderBy?: Extract<keyof Columns, string>
    }
  >
) => Promise<
  Readonly<
    utils.Merge<
      Awaited<Res<client.Client['findTableRows']>>,
      {
        rows: Awaited<Res<client.Client['findTableRows']>>['rows'] & Columns[]
      }
    >
  >
>

export type DeleteTableRows<TBot extends common.BaseBot> = <TableName extends keyof common.EnumerateTables<TBot>>(
  x: utils.Merge<
    Arg<client.Client['deleteTableRows']>,
    {
      table: utils.Cast<TableName, string>
      filter?: TableRowFilter<TBot, TableName>
    }
  >
) => Promise<Readonly<Awaited<Res<client.Client['deleteTableRows']>>>>

export type UpdateTableRows<TBot extends common.BaseBot> = <
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>>,
>(
  x: utils.Merge<
    Arg<client.Client['updateTableRows']>,
    {
      table: utils.Cast<TableName, string>
      rows: utils.AtLeastOne<utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>> & { id: number }>
    }
  >
) => Promise<
  Readonly<
    utils.Merge<
      Awaited<Res<client.Client['updateTableRows']>>,
      {
        rows: Awaited<Res<client.Client['updateTableRows']>>['rows'] & Columns[]
      }
    >
  >
>

export type UpsertTableRows<TBot extends common.BaseBot> = <
  TableName extends keyof common.EnumerateTables<TBot>,
  Columns = utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>>,
>(
  x: utils.Merge<
    Arg<client.Client['upsertTableRows']>,
    {
      table: utils.Cast<TableName, string>
      rows: utils.AtLeastOne<utils.Cast<common.EnumerateTables<TBot>[TableName], Record<string, any>> & { id: number }>
      keyColumn?: Extract<keyof common.EnumerateTables<TBot>[TableName], string> | 'id'
    }
  >
) => Promise<
  Readonly<
    utils.Merge<
      Awaited<Res<client.Client['upsertTableRows']>>,
      {
        inserted: Awaited<Res<client.Client['upsertTableRows']>>['inserted'] & Columns[]
        updated: Awaited<Res<client.Client['upsertTableRows']>>['updated'] & Columns[]
      }
    >
  >
>

export type TrackAnalytics<_TBot extends common.BaseBot> = client.Client['trackAnalytics']

export type ClientOperations<TBot extends common.BaseBot> = {
  getConversation: GetConversation<TBot>
  listConversations: ListConversations<TBot>
  updateConversation: UpdateConversation<TBot>
  deleteConversation: DeleteConversation<TBot>
  listParticipants: ListParticipants<TBot>
  addParticipant: AddParticipant<TBot>
  getParticipant: GetParticipant<TBot>
  removeParticipant: RemoveParticipant<TBot>
  getEvent: GetEvent<TBot>
  listEvents: ListEvents<TBot>
  createMessage: CreateMessage<TBot>
  getOrCreateMessage: GetOrCreateMessage<TBot>
  getMessage: GetMessage<TBot>
  updateMessage: UpdateMessage<TBot>
  listMessages: ListMessages<TBot>
  deleteMessage: DeleteMessage<TBot>
  getUser: GetUser<TBot>
  listUsers: ListUsers<TBot>
  updateUser: UpdateUser<TBot>
  deleteUser: DeleteUser<TBot>
  getState: GetState<TBot>
  setState: SetState<TBot>
  getOrSetState: GetOrSetState<TBot>
  patchState: PatchState<TBot>
  callAction: CallAction<TBot>
  uploadFile: UploadFile<TBot>
  upsertFile: UpsertFile<TBot>
  deleteFile: DeleteFile<TBot>
  listFiles: ListFiles<TBot>
  getFile: GetFile<TBot>
  updateFileMetadata: UpdateFileMetadata<TBot>
  searchFiles: SearchFiles<TBot>
  trackAnalytics: TrackAnalytics<TBot>
  getTableRow: GetTableRow<TBot>
  createTableRows: CreateTableRows<TBot>
  findTableRows: FindTableRows<TBot>
  deleteTableRows: DeleteTableRows<TBot>
  updateTableRows: UpdateTableRows<TBot>
  upsertTableRows: UpsertTableRows<TBot>
}

export type ClientInputs<TBot extends common.BaseBot> = {
  [K in keyof ClientOperations<TBot>]: Arg<ClientOperations<TBot>[K]>
}

export type ClientOutputs<TBot extends common.BaseBot> = {
  [K in keyof ClientOperations<TBot>]: Awaited<Res<ClientOperations<TBot>[K]>>
}

type ClientHooksBefore = {
  [K in client.Operation]?: (x: client.ClientInputs[K]) => Promise<client.ClientInputs[K]>
}

type ClientHooksAfter = {
  [K in client.Operation]?: (x: client.ClientOutputs[K]) => Promise<client.ClientOutputs[K]>
}

export type ClientHooks = {
  before: ClientHooksBefore
  after: ClientHooksAfter
}
