import * as client from '@botpress/client'
import * as common from '../types'
import * as types from './types'

export * from './types'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends common.BaseBot> implements types.ClientOperations<TBot> {
  public constructor(private readonly _client: client.Client) {}

  public getConversation: types.GetConversation<TBot> = ((x) =>
    this._client.getConversation(x)) as types.GetConversation<TBot>
  public listConversations: types.ListConversations<TBot> = ((x) =>
    this._client.listConversations(x)) as types.ListConversations<TBot>
  public updateConversation: types.UpdateConversation<TBot> = ((x) =>
    this._client.updateConversation(x)) as types.UpdateConversation<TBot>
  public deleteConversation: types.DeleteConversation<TBot> = ((x) =>
    this._client.deleteConversation(x)) as types.DeleteConversation<TBot>
  public listParticipants: types.ListParticipants<TBot> = ((x) =>
    this._client.listParticipants(x)) as types.ListParticipants<TBot>
  public addParticipant: types.AddParticipant<TBot> = ((x) =>
    this._client.addParticipant(x)) as types.AddParticipant<TBot>
  public getParticipant: types.GetParticipant<TBot> = ((x) =>
    this._client.getParticipant(x)) as types.GetParticipant<TBot>
  public removeParticipant: types.RemoveParticipant<TBot> = ((x) =>
    this._client.removeParticipant(x)) as types.RemoveParticipant<TBot>
  public getEvent: types.GetEvent<TBot> = ((x) => this._client.getEvent(x)) as types.GetEvent<TBot>
  public listEvents: types.ListEvents<TBot> = ((x) => this._client.listEvents(x)) as types.ListEvents<TBot>
  public createMessage: types.CreateMessage<TBot> = ((x) => this._client.createMessage(x)) as types.CreateMessage<TBot>
  public getOrCreateMessage: types.GetOrCreateMessage<TBot> = ((x) =>
    this._client.getOrCreateMessage(x)) as types.GetOrCreateMessage<TBot>
  public getMessage: types.GetMessage<TBot> = ((x) => this._client.getMessage(x)) as types.GetMessage<TBot>
  public updateMessage: types.UpdateMessage<TBot> = ((x) => this._client.updateMessage(x)) as types.UpdateMessage<TBot>
  public listMessages: types.ListMessages<TBot> = ((x) => this._client.listMessages(x)) as types.ListMessages<TBot>
  public deleteMessage: types.DeleteMessage<TBot> = ((x) => this._client.deleteMessage(x)) as types.DeleteMessage<TBot>
  public getUser: types.GetUser<TBot> = ((x) => this._client.getUser(x)) as types.GetUser<TBot>
  public listUsers: types.ListUsers<TBot> = ((x) => this._client.listUsers(x)) as types.ListUsers<TBot>
  public updateUser: types.UpdateUser<TBot> = ((x) => this._client.updateUser(x)) as types.UpdateUser<TBot>
  public deleteUser: types.DeleteUser<TBot> = ((x) => this._client.deleteUser(x)) as types.DeleteUser<TBot>
  public getState: types.GetState<TBot> = ((x) => this._client.getState(x)) as types.GetState<TBot>
  public setState: types.SetState<TBot> = ((x) => this._client.setState(x)) as types.SetState<TBot>
  public getOrSetState: types.GetOrSetState<TBot> = ((x) => this._client.getOrSetState(x)) as types.GetOrSetState<TBot>
  public patchState: types.PatchState<TBot> = ((x) => this._client.patchState(x)) as types.PatchState<TBot>
  public callAction: types.CallAction<TBot> = ((x) => this._client.callAction(x)) as types.CallAction<TBot>
  public uploadFile: types.UploadFile<TBot> = ((x) => this._client.uploadFile(x)) as types.UploadFile<TBot>
  public upsertFile: types.UpsertFile<TBot> = ((x) => this._client.upsertFile(x)) as types.UpsertFile<TBot>
  public deleteFile: types.DeleteFile<TBot> = ((x) => this._client.deleteFile(x)) as types.DeleteFile<TBot>
  public listFiles: types.ListFiles<TBot> = ((x) => this._client.listFiles(x)) as types.ListFiles<TBot>
  public getFile: types.GetFile<TBot> = ((x) => this._client.getFile(x)) as types.GetFile<TBot>
  public updateFileMetadata: types.UpdateFileMetadata<TBot> = ((x) =>
    this._client.updateFileMetadata(x)) as types.UpdateFileMetadata<TBot>
  public searchFiles: types.SearchFiles<TBot> = ((x) => this._client.searchFiles(x)) as types.SearchFiles<TBot>

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
}
