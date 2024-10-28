import { Client } from '@botpress/client'
import { BaseBot } from '../types/generic'
import * as types from './types'

export * from './types'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends BaseBot> {
  public constructor(private readonly _client: Client) {}

  public getConversation: types.GetConversation<TBot> = (x) => this._client.getConversation(x)
  public listConversations: types.ListConversations<TBot> = (x) => this._client.listConversations(x)
  public updateConversation: types.UpdateConversation<TBot> = (x) => this._client.updateConversation(x)
  public deleteConversation: types.DeleteConversation<TBot> = (x) => this._client.deleteConversation(x)

  public listParticipants: types.ListParticipants<TBot> = (x) => this._client.listParticipants(x)
  public addParticipant: types.AddParticipant<TBot> = (x) => this._client.addParticipant(x)
  public getParticipant: types.GetParticipant<TBot> = (x) => this._client.getParticipant(x)
  public removeParticipant: types.RemoveParticipant<TBot> = (x) => this._client.removeParticipant(x)

  public getEvent: types.GetEvent<TBot> = ((x) => this._client.getEvent(x)) as types.GetEvent<TBot>
  public listEvents: types.ListEvents<TBot> = ((x) => this._client.listEvents(x)) as types.ListEvents<TBot>

  public createMessage: types.CreateMessage<TBot> = ((x) => this._client.createMessage(x)) as types.CreateMessage<TBot>
  public getOrCreateMessage: types.GetOrCreateMessage<TBot> = ((x) =>
    this._client.getOrCreateMessage(x)) as types.GetOrCreateMessage<TBot>
  public getMessage: types.GetMessage<TBot> = ((x) => this._client.getMessage(x)) as types.GetMessage<TBot>
  public updateMessage: types.UpdateMessage<TBot> = ((x) => this._client.updateMessage(x)) as types.UpdateMessage<TBot>
  public listMessages: types.ListMessages<TBot> = ((x) => this._client.listMessages(x)) as types.ListMessages<TBot>
  public deleteMessage: types.DeleteMessage<TBot> = ((x) => this._client.deleteMessage(x)) as types.DeleteMessage<TBot>

  public getUser: types.GetUser<TBot> = (x) => this._client.getUser(x)
  public listUsers: types.ListUsers<TBot> = (x) => this._client.listUsers(x)
  public updateUser: types.UpdateUser<TBot> = (x) => this._client.updateUser(x)
  public deleteUser: types.DeleteUser<TBot> = (x) => this._client.deleteUser(x)

  public getState: types.GetState<TBot> = ((x) =>
    this._client.getState(x).then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as types.GetState<TBot>
  public setState: types.SetState<TBot> = ((x) =>
    this._client.setState(x).then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as types.SetState<TBot>
  public getOrSetState: types.GetOrSetState<TBot> = ((x) =>
    this._client
      .getOrSetState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as types.GetOrSetState<TBot>
  public patchState: types.PatchState<TBot> = ((x) =>
    this._client
      .patchState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as types.PatchState<TBot>

  public callAction: types.CallAction<TBot> = (x) => this._client.callAction(x)

  public uploadFile: types.UploadFile<TBot> = (x) => this._client.uploadFile(x)
  public upsertFile: types.UpsertFile<TBot> = (x) => this._client.upsertFile(x)
  public deleteFile: types.DeleteFile<TBot> = (x) => this._client.deleteFile(x)
  public listFiles: types.ListFiles<TBot> = (x) => this._client.listFiles(x)
  public getFile: types.GetFile<TBot> = (x) => this._client.getFile(x)
  public updateFileMetadata: types.UpdateFileMetadata<TBot> = (x) => this._client.updateFileMetadata(x)
  public searchFiles: types.SearchFiles<TBot> = (x) => this._client.searchFiles(x)

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
