import { Client } from '@botpress/client'
import { BaseBot } from '../generic'
import * as routes from './routes'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends BaseBot> {
  public constructor(private readonly _client: Client) {}

  public getConversation: routes.GetConversation<TBot> = (x) => this._client.getConversation(x)
  public listConversations: routes.ListConversations<TBot> = (x) => this._client.listConversations(x)
  public updateConversation: routes.UpdateConversation<TBot> = (x) => this._client.updateConversation(x)
  public deleteConversation: routes.DeleteConversation<TBot> = (x) => this._client.deleteConversation(x)

  public listParticipants: routes.ListParticipants<TBot> = (x) => this._client.listParticipants(x)
  public addParticipant: routes.AddParticipant<TBot> = (x) => this._client.addParticipant(x)
  public getParticipant: routes.GetParticipant<TBot> = (x) => this._client.getParticipant(x)
  public removeParticipant: routes.RemoveParticipant<TBot> = (x) => this._client.removeParticipant(x)

  public getEvent: routes.GetEvent<TBot> = ((x) => this._client.getEvent(x)) as routes.GetEvent<TBot>
  public listEvents: routes.ListEvents<TBot> = ((x) => this._client.listEvents(x)) as routes.ListEvents<TBot>

  public createMessage: routes.CreateMessage<TBot> = ((x) =>
    this._client.createMessage(x)) as routes.CreateMessage<TBot>
  public getOrCreateMessage: routes.GetOrCreateMessage<TBot> = ((x) =>
    this._client.getOrCreateMessage(x)) as routes.GetOrCreateMessage<TBot>
  public getMessage: routes.GetMessage<TBot> = ((x) => this._client.getMessage(x)) as routes.GetMessage<TBot>
  public updateMessage: routes.UpdateMessage<TBot> = ((x) =>
    this._client.updateMessage(x)) as routes.UpdateMessage<TBot>
  public listMessages: routes.ListMessages<TBot> = ((x) => this._client.listMessages(x)) as routes.ListMessages<TBot>
  public deleteMessage: routes.DeleteMessage<TBot> = ((x) =>
    this._client.deleteMessage(x)) as routes.DeleteMessage<TBot>

  public getUser: routes.GetUser<TBot> = (x) => this._client.getUser(x)
  public listUsers: routes.ListUsers<TBot> = (x) => this._client.listUsers(x)
  public updateUser: routes.UpdateUser<TBot> = (x) => this._client.updateUser(x)
  public deleteUser: routes.DeleteUser<TBot> = (x) => this._client.deleteUser(x)

  public getState: routes.GetState<TBot> = ((x) =>
    this._client
      .getState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.GetState<TBot>
  public setState: routes.SetState<TBot> = ((x) =>
    this._client
      .setState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.SetState<TBot>
  public getOrSetState: routes.GetOrSetState<TBot> = ((x) =>
    this._client
      .getOrSetState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.GetOrSetState<TBot>
  public patchState: routes.PatchState<TBot> = ((x) =>
    this._client
      .patchState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.PatchState<TBot>

  public callAction: routes.CallAction<TBot> = (x) => this._client.callAction(x)

  public uploadFile: routes.UploadFile<TBot> = (x) => this._client.uploadFile(x)
  public upsertFile: routes.UpsertFile<TBot> = (x) => this._client.upsertFile(x)
  public deleteFile: routes.DeleteFile<TBot> = (x) => this._client.deleteFile(x)
  public listFiles: routes.ListFiles<TBot> = (x) => this._client.listFiles(x)
  public getFile: routes.GetFile<TBot> = (x) => this._client.getFile(x)
  public updateFileMetadata: routes.UpdateFileMetadata<TBot> = (x) => this._client.updateFileMetadata(x)
  public searchFiles: routes.SearchFiles<TBot> = (x) => this._client.searchFiles(x)

  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public createConversation: routes.CreateConversation<TBot> = (x) => this._client.createConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public getOrCreateConversation: routes.GetOrCreateConversation<TBot> = (x) => this._client.getOrCreateConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public createUser: routes.CreateUser<TBot> = (x) => this._client.createUser(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public getOrCreateUser: routes.GetOrCreateUser<TBot> = (x) => this._client.getOrCreateUser(x)
}
