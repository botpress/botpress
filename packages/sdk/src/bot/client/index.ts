import { Client } from '@botpress/client'
import { BaseBot } from '../generic'
import * as routes from './routes'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends BaseBot> {
  public constructor(public readonly inner: Client) {}

  public getConversation: routes.GetConversation<TBot> = (x) => this.inner.getConversation(x)
  public listConversations: routes.ListConversations<TBot> = (x) => this.inner.listConversations(x)
  public updateConversation: routes.UpdateConversation<TBot> = (x) => this.inner.updateConversation(x)
  public deleteConversation: routes.DeleteConversation<TBot> = (x) => this.inner.deleteConversation(x)

  public listParticipants: routes.ListParticipants<TBot> = (x) => this.inner.listParticipants(x)
  public addParticipant: routes.AddParticipant<TBot> = (x) => this.inner.addParticipant(x)
  public getParticipant: routes.GetParticipant<TBot> = (x) => this.inner.getParticipant(x)
  public removeParticipant: routes.RemoveParticipant<TBot> = (x) => this.inner.removeParticipant(x)

  public getEvent: routes.GetEvent<TBot> = ((x) => this.inner.getEvent(x)) as routes.GetEvent<TBot>
  public listEvents: routes.ListEvents<TBot> = ((x) => this.inner.listEvents(x)) as routes.ListEvents<TBot>

  public createMessage: routes.CreateMessage<TBot> = ((x) => this.inner.createMessage(x)) as routes.CreateMessage<TBot>
  public getOrCreateMessage: routes.GetOrCreateMessage<TBot> = ((x) =>
    this.inner.getOrCreateMessage(x)) as routes.GetOrCreateMessage<TBot>
  public getMessage: routes.GetMessage<TBot> = ((x) => this.inner.getMessage(x)) as routes.GetMessage<TBot>
  public updateMessage: routes.UpdateMessage<TBot> = ((x) => this.inner.updateMessage(x)) as routes.UpdateMessage<TBot>
  public listMessages: routes.ListMessages<TBot> = ((x) => this.inner.listMessages(x)) as routes.ListMessages<TBot>
  public deleteMessage: routes.DeleteMessage<TBot> = ((x) => this.inner.deleteMessage(x)) as routes.DeleteMessage<TBot>

  public getUser: routes.GetUser<TBot> = (x) => this.inner.getUser(x)
  public listUsers: routes.ListUsers<TBot> = (x) => this.inner.listUsers(x)
  public updateUser: routes.UpdateUser<TBot> = (x) => this.inner.updateUser(x)
  public deleteUser: routes.DeleteUser<TBot> = (x) => this.inner.deleteUser(x)

  public getState: routes.GetState<TBot> = ((x) =>
    this.inner.getState(x).then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.GetState<TBot>
  public setState: routes.SetState<TBot> = ((x) =>
    this.inner.setState(x).then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.SetState<TBot>
  public getOrSetState: routes.GetOrSetState<TBot> = ((x) =>
    this.inner
      .getOrSetState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.GetOrSetState<TBot>
  public patchState: routes.PatchState<TBot> = ((x) =>
    this.inner
      .patchState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.PatchState<TBot>

  public callAction: routes.CallAction<TBot> = (x) => this.inner.callAction(x)

  public uploadFile: routes.UploadFile<TBot> = (x) => this.inner.uploadFile(x)
  public upsertFile: routes.UpsertFile<TBot> = (x) => this.inner.upsertFile(x)
  public deleteFile: routes.DeleteFile<TBot> = (x) => this.inner.deleteFile(x)
  public listFiles: routes.ListFiles<TBot> = (x) => this.inner.listFiles(x)
  public getFile: routes.GetFile<TBot> = (x) => this.inner.getFile(x)
  public updateFileMetadata: routes.UpdateFileMetadata<TBot> = (x) => this.inner.updateFileMetadata(x)
  public searchFiles: routes.SearchFiles<TBot> = (x) => this.inner.searchFiles(x)

  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public createConversation: routes.CreateConversation<TBot> = (x) => this.inner.createConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public getOrCreateConversation: routes.GetOrCreateConversation<TBot> = (x) => this.inner.getOrCreateConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public createUser: routes.CreateUser<TBot> = (x) => this.inner.createUser(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public getOrCreateUser: routes.GetOrCreateUser<TBot> = (x) => this.inner.getOrCreateUser(x)
}
