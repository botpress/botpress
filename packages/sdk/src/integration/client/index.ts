import { Client } from '@botpress/client'
import { BaseIntegration } from '../generic'
import * as routes from './routes'

/**
 * Just like the regular botpress client, but typed with the integration's properties.
 */
export class IntegrationSpecificClient<TIntegration extends BaseIntegration> {
  public constructor(public readonly inner: Client) {}

  public createConversation: routes.CreateConversation<TIntegration> = ((x) =>
    this.inner.createConversation(x)) as routes.CreateConversation<TIntegration>
  public getConversation: routes.GetConversation<TIntegration> = ((x) =>
    this.inner.getConversation(x)) as routes.GetConversation<TIntegration>
  public listConversations: routes.ListConversations<TIntegration> = ((x) =>
    this.inner.listConversations(x)) as routes.ListConversations<TIntegration>
  public getOrCreateConversation: routes.GetOrCreateConversation<TIntegration> = ((x) =>
    this.inner.getOrCreateConversation(x)) as routes.GetOrCreateConversation<TIntegration>
  public updateConversation: routes.UpdateConversation<TIntegration> = ((x) =>
    this.inner.updateConversation(x)) as routes.UpdateConversation<TIntegration>
  public deleteConversation: routes.DeleteConversation<TIntegration> = ((x) =>
    this.inner.deleteConversation(x)) as routes.DeleteConversation<TIntegration>

  public listParticipants: routes.ListParticipants<TIntegration> = ((x) =>
    this.inner.listParticipants(x)) as routes.ListParticipants<TIntegration>
  public addParticipant: routes.AddParticipant<TIntegration> = ((x) =>
    this.inner.addParticipant(x)) as routes.AddParticipant<TIntegration>
  public getParticipant: routes.GetParticipant<TIntegration> = ((x) =>
    this.inner.getParticipant(x)) as routes.GetParticipant<TIntegration>
  public removeParticipant: routes.RemoveParticipant<TIntegration> = ((x) =>
    this.inner.removeParticipant(x)) as routes.RemoveParticipant<TIntegration>

  public createEvent: routes.CreateEvent<TIntegration> = ((x) =>
    this.inner.createEvent(x)) as routes.CreateEvent<TIntegration>
  public getEvent: routes.GetEvent<TIntegration> = ((x) => this.inner.getEvent(x)) as routes.GetEvent<TIntegration>
  public listEvents: routes.ListEvents<TIntegration> = ((x) =>
    this.inner.listEvents(x)) as routes.ListEvents<TIntegration>

  public createMessage: routes.CreateMessage<TIntegration> = ((x) =>
    this.inner.createMessage(x)) as routes.CreateMessage<TIntegration>
  public getOrCreateMessage: routes.GetOrCreateMessage<TIntegration> = ((x) =>
    this.inner.getOrCreateMessage(x)) as routes.GetOrCreateMessage<TIntegration>
  public getMessage: routes.GetMessage<TIntegration> = ((x) =>
    this.inner.getMessage(x)) as routes.GetMessage<TIntegration>
  public updateMessage: routes.UpdateMessage<TIntegration> = ((x) =>
    this.inner.updateMessage(x)) as routes.UpdateMessage<TIntegration>
  public listMessages: routes.ListMessages<TIntegration> = ((x) =>
    this.inner.listMessages(x)) as routes.ListMessages<TIntegration>
  public deleteMessage: routes.DeleteMessage<TIntegration> = ((x) =>
    this.inner.deleteMessage(x)) as routes.DeleteMessage<TIntegration>

  public createUser: routes.CreateUser<TIntegration> = ((x) =>
    this.inner.createUser(x)) as routes.CreateUser<TIntegration>
  public getUser: routes.GetUser<TIntegration> = ((x) => this.inner.getUser(x)) as routes.GetUser<TIntegration>
  public listUsers: routes.ListUsers<TIntegration> = (x) => this.inner.listUsers(x)
  public getOrCreateUser: routes.GetOrCreateUser<TIntegration> = ((x) =>
    this.inner.getOrCreateUser(x)) as routes.GetOrCreateUser<TIntegration>
  public updateUser: routes.UpdateUser<TIntegration> = ((x) =>
    this.inner.updateUser(x)) as routes.UpdateUser<TIntegration>
  public deleteUser: routes.DeleteUser<TIntegration> = (x) => this.inner.deleteUser(x)

  public getState: routes.GetState<TIntegration> = ((x) => this.inner.getState(x)) as routes.GetState<TIntegration>
  public setState: routes.SetState<TIntegration> = ((x) => this.inner.setState(x)) as routes.SetState<TIntegration>
  public getOrSetState: routes.GetOrSetState<TIntegration> = ((x) =>
    this.inner.getOrSetState(x)) as routes.GetOrSetState<TIntegration>
  public patchState: routes.PatchState<TIntegration> = ((x) =>
    this.inner.patchState(x)) as routes.PatchState<TIntegration>

  public configureIntegration: routes.ConfigureIntegration<TIntegration> = (x) => this.inner.configureIntegration(x)

  public uploadFile: routes.UploadFile<TIntegration> = (x) => this.inner.uploadFile(x)
  public upsertFile: routes.UpsertFile<TIntegration> = (x) => this.inner.upsertFile(x)
  public deleteFile: routes.DeleteFile<TIntegration> = (x) => this.inner.deleteFile(x)
  public listFiles: routes.ListFiles<TIntegration> = (x) => this.inner.listFiles(x)
  public getFile: routes.GetFile<TIntegration> = (x) => this.inner.getFile(x)
  public updateFileMetadata: routes.UpdateFileMetadata<TIntegration> = (x) => this.inner.updateFileMetadata(x)
}
