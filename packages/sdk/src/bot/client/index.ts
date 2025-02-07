import * as client from '@botpress/client'
import * as common from '../types'
import * as types from './types'

export * from './types'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends common.BaseBot> implements types.ClientOperations<TBot> {
  public constructor(
    private _client: client.Client,
    private _hooks: types.ClientHooks = { before: {}, after: {} }
  ) {}

  public getConversation: types.GetConversation<TBot> = ((x) =>
    this._run('getConversation', x)) as types.GetConversation<TBot>
  public listConversations: types.ListConversations<TBot> = ((x) =>
    this._run('listConversations', x)) as types.ListConversations<TBot>
  public updateConversation: types.UpdateConversation<TBot> = ((x) =>
    this._run('updateConversation', x)) as types.UpdateConversation<TBot>
  public deleteConversation: types.DeleteConversation<TBot> = ((x) =>
    this._run('deleteConversation', x)) as types.DeleteConversation<TBot>
  public listParticipants: types.ListParticipants<TBot> = ((x) =>
    this._run('listParticipants', x)) as types.ListParticipants<TBot>
  public addParticipant: types.AddParticipant<TBot> = ((x) =>
    this._run('addParticipant', x)) as types.AddParticipant<TBot>
  public getParticipant: types.GetParticipant<TBot> = ((x) =>
    this._run('getParticipant', x)) as types.GetParticipant<TBot>
  public removeParticipant: types.RemoveParticipant<TBot> = ((x) =>
    this._run('removeParticipant', x)) as types.RemoveParticipant<TBot>
  public getEvent: types.GetEvent<TBot> = ((x) => this._run('getEvent', x)) as types.GetEvent<TBot>
  public listEvents: types.ListEvents<TBot> = ((x) => this._run('listEvents', x)) as types.ListEvents<TBot>
  public createMessage: types.CreateMessage<TBot> = ((x) => this._run('createMessage', x)) as types.CreateMessage<TBot>
  public getOrCreateMessage: types.GetOrCreateMessage<TBot> = ((x) =>
    this._run('getOrCreateMessage', x)) as types.GetOrCreateMessage<TBot>
  public getMessage: types.GetMessage<TBot> = ((x) => this._run('getMessage', x)) as types.GetMessage<TBot>
  public updateMessage: types.UpdateMessage<TBot> = ((x) => this._run('updateMessage', x)) as types.UpdateMessage<TBot>
  public listMessages: types.ListMessages<TBot> = ((x) => this._run('listMessages', x)) as types.ListMessages<TBot>
  public deleteMessage: types.DeleteMessage<TBot> = ((x) => this._run('deleteMessage', x)) as types.DeleteMessage<TBot>
  public getUser: types.GetUser<TBot> = ((x) => this._run('getUser', x)) as types.GetUser<TBot>
  public listUsers: types.ListUsers<TBot> = ((x) => this._run('listUsers', x)) as types.ListUsers<TBot>
  public updateUser: types.UpdateUser<TBot> = ((x) => this._run('updateUser', x)) as types.UpdateUser<TBot>
  public deleteUser: types.DeleteUser<TBot> = ((x) => this._run('deleteUser', x)) as types.DeleteUser<TBot>
  public getState: types.GetState<TBot> = ((x) => this._run('getState', x)) as types.GetState<TBot>
  public setState: types.SetState<TBot> = ((x) => this._run('setState', x)) as types.SetState<TBot>
  public getOrSetState: types.GetOrSetState<TBot> = ((x) => this._run('getOrSetState', x)) as types.GetOrSetState<TBot>
  public patchState: types.PatchState<TBot> = ((x) => this._run('patchState', x)) as types.PatchState<TBot>
  public callAction: types.CallAction<TBot> = ((x) => this._run('callAction', x)) as types.CallAction<TBot>
  public uploadFile: types.UploadFile<TBot> = ((x) => this._run('uploadFile', x)) as types.UploadFile<TBot>
  public upsertFile: types.UpsertFile<TBot> = ((x) => this._run('upsertFile', x)) as types.UpsertFile<TBot>
  public deleteFile: types.DeleteFile<TBot> = ((x) => this._run('deleteFile', x)) as types.DeleteFile<TBot>
  public listFiles: types.ListFiles<TBot> = ((x) => this._run('listFiles', x)) as types.ListFiles<TBot>
  public getFile: types.GetFile<TBot> = ((x) => this._run('getFile', x)) as types.GetFile<TBot>
  public updateFileMetadata: types.UpdateFileMetadata<TBot> = ((x) =>
    this._run('updateFileMetadata', x)) as types.UpdateFileMetadata<TBot>
  public searchFiles: types.SearchFiles<TBot> = ((x) => this._run('searchFiles', x)) as types.SearchFiles<TBot>
  public trackAnalytics: types.TrackAnalytics<TBot> = ((x) =>
    this._run('trackAnalytics', x)) as types.TrackAnalytics<TBot>
  public getTableRow: types.GetTableRow<TBot> = ((x) => this._run('getTableRow', x)) as types.GetTableRow<TBot>
  public createTableRows: types.CreateTableRows<TBot> = ((x) =>
    this._run('createTableRows', x)) as types.CreateTableRows<TBot>
  public findTableRows: types.FindTableRows<TBot> = ((x) => this._run('findTableRows', x)) as types.FindTableRows<TBot>
  public deleteTableRows: types.DeleteTableRows<TBot> = ((x) =>
    this._run('deleteTableRows', x)) as types.DeleteTableRows<TBot>
  public updateTableRows: types.UpdateTableRows<TBot> = ((x) =>
    this._run('updateTableRows', x)) as types.UpdateTableRows<TBot>
  public upsertTableRows: types.UpsertTableRows<TBot> = ((x) =>
    this._run('upsertTableRows', x)) as types.UpsertTableRows<TBot>

  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public createConversation: types.CreateConversation<TBot> = (x) => this._client.createConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public getOrCreateConversation: types.GetOrCreateConversation<TBot> = (x) => this._client.getOrCreateConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public createUser: types.CreateUser<TBot> = (x) => this._client.createUser(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public getOrCreateUser: types.GetOrCreateUser<TBot> = (x) => this._client.getOrCreateUser(x)

  private _run = async <K extends client.Operation>(
    operation: K,
    req: client.ClientInputs[K]
  ): Promise<client.ClientOutputs[K]> => {
    const before = this._hooks.before[operation]
    if (before) {
      req = await before(req)
    }

    let res = (await this._client[operation](req as any)) as client.ClientOutputs[K]

    const after = this._hooks.after[operation]
    if (after) {
      res = await after(res)
    }

    return res
  }
}
