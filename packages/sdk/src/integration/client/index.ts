import { Client } from '@botpress/client'
import { BaseIntegration } from '../generic'
import * as routes from './routes'

/**
 * Just like the regular botpress client, but typed with the integration's properties.
 */
export class IntegrationSpecificClient<TIntegration extends BaseIntegration> {
  public constructor(private readonly _client: Client) {}

  public createConversation: routes.CreateConversation<TIntegration> = ((x) =>
    this._client.createConversation(x)) as routes.CreateConversation<TIntegration>
  public getConversation: routes.GetConversation<TIntegration> = ((x) =>
    this._client.getConversation(x)) as routes.GetConversation<TIntegration>
  public listConversations: routes.ListConversations<TIntegration> = ((x) =>
    this._client.listConversations(x)) as routes.ListConversations<TIntegration>
  public getOrCreateConversation: routes.GetOrCreateConversation<TIntegration> = ((x) =>
    this._client.getOrCreateConversation(x)) as routes.GetOrCreateConversation<TIntegration>
  public updateConversation: routes.UpdateConversation<TIntegration> = ((x) =>
    this._client.updateConversation(x)) as routes.UpdateConversation<TIntegration>
  public deleteConversation: routes.DeleteConversation<TIntegration> = ((x) =>
    this._client.deleteConversation(x)) as routes.DeleteConversation<TIntegration>

  public listParticipants: routes.ListParticipants<TIntegration> = ((x) =>
    this._client.listParticipants(x)) as routes.ListParticipants<TIntegration>
  public addParticipant: routes.AddParticipant<TIntegration> = ((x) =>
    this._client.addParticipant(x)) as routes.AddParticipant<TIntegration>
  public getParticipant: routes.GetParticipant<TIntegration> = ((x) =>
    this._client.getParticipant(x)) as routes.GetParticipant<TIntegration>
  public removeParticipant: routes.RemoveParticipant<TIntegration> = ((x) =>
    this._client.removeParticipant(x)) as routes.RemoveParticipant<TIntegration>

  public createEvent: routes.CreateEvent<TIntegration> = ((x) =>
    this._client.createEvent(x)) as routes.CreateEvent<TIntegration>
  public getEvent: routes.GetEvent<TIntegration> = ((x) => this._client.getEvent(x)) as routes.GetEvent<TIntegration>
  public listEvents: routes.ListEvents<TIntegration> = ((x) =>
    this._client.listEvents(x)) as routes.ListEvents<TIntegration>

  public createMessage: routes.CreateMessage<TIntegration> = ((x) =>
    this._client.createMessage(x)) as routes.CreateMessage<TIntegration>
  public getOrCreateMessage: routes.GetOrCreateMessage<TIntegration> = ((x) =>
    this._client.getOrCreateMessage(x)) as routes.GetOrCreateMessage<TIntegration>
  public getMessage: routes.GetMessage<TIntegration> = ((x) =>
    this._client.getMessage(x)) as routes.GetMessage<TIntegration>
  public updateMessage: routes.UpdateMessage<TIntegration> = ((x) =>
    this._client.updateMessage(x)) as routes.UpdateMessage<TIntegration>
  public listMessages: routes.ListMessages<TIntegration> = ((x) =>
    this._client.listMessages(x)) as routes.ListMessages<TIntegration>
  public deleteMessage: routes.DeleteMessage<TIntegration> = ((x) =>
    this._client.deleteMessage(x)) as routes.DeleteMessage<TIntegration>

  public createUser: routes.CreateUser<TIntegration> = ((x) =>
    this._client.createUser(x)) as routes.CreateUser<TIntegration>
  public getUser: routes.GetUser<TIntegration> = ((x) => this._client.getUser(x)) as routes.GetUser<TIntegration>
  public listUsers: routes.ListUsers<TIntegration> = (x) => this._client.listUsers(x)
  public getOrCreateUser: routes.GetOrCreateUser<TIntegration> = ((x) =>
    this._client.getOrCreateUser(x)) as routes.GetOrCreateUser<TIntegration>
  public updateUser: routes.UpdateUser<TIntegration> = ((x) =>
    this._client.updateUser(x)) as routes.UpdateUser<TIntegration>
  public deleteUser: routes.DeleteUser<TIntegration> = (x) => this._client.deleteUser(x)

  public getState: routes.GetState<TIntegration> = ((x) => this._client.getState(x)) as routes.GetState<TIntegration>
  public setState: routes.SetState<TIntegration> = ((x) => this._client.setState(x)) as routes.SetState<TIntegration>
  public getOrSetState: routes.GetOrSetState<TIntegration> = ((x) =>
    this._client.getOrSetState(x)) as routes.GetOrSetState<TIntegration>
  public patchState: routes.PatchState<TIntegration> = ((x) =>
    this._client.patchState(x)) as routes.PatchState<TIntegration>

  public configureIntegration: routes.ConfigureIntegration<TIntegration> = (x) => this._client.configureIntegration(x)

  public uploadFile: routes.UploadFile<TIntegration> = (x) => this._client.uploadFile(x)
  public upsertFile: routes.UpsertFile<TIntegration> = (x) => this._client.upsertFile(x)
  public deleteFile: routes.DeleteFile<TIntegration> = (x) => this._client.deleteFile(x)
  public listFiles: routes.ListFiles<TIntegration> = (x) => this._client.listFiles(x)
  public getFile: routes.GetFile<TIntegration> = (x) => this._client.getFile(x)
  public updateFileMetadata: routes.UpdateFileMetadata<TIntegration> = (x) => this._client.updateFileMetadata(x)
}
