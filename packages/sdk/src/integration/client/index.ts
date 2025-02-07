import * as client from '@botpress/client'
import * as common from '../types'
import * as types from './types'

export * from './types'

/**
 * Just like the regular botpress client, but typed with the integration's properties.
 */
export class IntegrationSpecificClient<TIntegration extends common.BaseIntegration>
  implements types.ClientOperations<TIntegration>
{
  public constructor(private readonly _client: client.Client) {}

  public createConversation: types.CreateConversation<TIntegration> = ((x) =>
    this._client.createConversation(x)) as types.CreateConversation<TIntegration>
  public getConversation: types.GetConversation<TIntegration> = ((x) =>
    this._client.getConversation(x)) as types.GetConversation<TIntegration>
  public listConversations: types.ListConversations<TIntegration> = ((x) =>
    this._client.listConversations(x)) as types.ListConversations<TIntegration>
  public getOrCreateConversation: types.GetOrCreateConversation<TIntegration> = ((x) =>
    this._client.getOrCreateConversation(x)) as types.GetOrCreateConversation<TIntegration>
  public updateConversation: types.UpdateConversation<TIntegration> = ((x) =>
    this._client.updateConversation(x)) as types.UpdateConversation<TIntegration>
  public deleteConversation: types.DeleteConversation<TIntegration> = ((x) =>
    this._client.deleteConversation(x)) as types.DeleteConversation<TIntegration>

  public listParticipants: types.ListParticipants<TIntegration> = ((x) =>
    this._client.listParticipants(x)) as types.ListParticipants<TIntegration>
  public addParticipant: types.AddParticipant<TIntegration> = ((x) =>
    this._client.addParticipant(x)) as types.AddParticipant<TIntegration>
  public getParticipant: types.GetParticipant<TIntegration> = ((x) =>
    this._client.getParticipant(x)) as types.GetParticipant<TIntegration>
  public removeParticipant: types.RemoveParticipant<TIntegration> = ((x) =>
    this._client.removeParticipant(x)) as types.RemoveParticipant<TIntegration>

  public createEvent: types.CreateEvent<TIntegration> = ((x) =>
    this._client.createEvent(x)) as types.CreateEvent<TIntegration>
  public getEvent: types.GetEvent<TIntegration> = ((x) => this._client.getEvent(x)) as types.GetEvent<TIntegration>
  public listEvents: types.ListEvents<TIntegration> = ((x) =>
    this._client.listEvents(x)) as types.ListEvents<TIntegration>

  public createMessage: types.CreateMessage<TIntegration> = ((x) =>
    this._client.createMessage(x)) as types.CreateMessage<TIntegration>
  public getOrCreateMessage: types.GetOrCreateMessage<TIntegration> = ((x) =>
    this._client.getOrCreateMessage(x)) as types.GetOrCreateMessage<TIntegration>
  public getMessage: types.GetMessage<TIntegration> = ((x) =>
    this._client.getMessage(x)) as types.GetMessage<TIntegration>
  public updateMessage: types.UpdateMessage<TIntegration> = ((x) =>
    this._client.updateMessage(x)) as types.UpdateMessage<TIntegration>
  public listMessages: types.ListMessages<TIntegration> = ((x) =>
    this._client.listMessages(x)) as types.ListMessages<TIntegration>
  public deleteMessage: types.DeleteMessage<TIntegration> = ((x) =>
    this._client.deleteMessage(x)) as types.DeleteMessage<TIntegration>

  public createUser: types.CreateUser<TIntegration> = ((x) =>
    this._client.createUser(x)) as types.CreateUser<TIntegration>
  public getUser: types.GetUser<TIntegration> = ((x) => this._client.getUser(x)) as types.GetUser<TIntegration>
  public listUsers: types.ListUsers<TIntegration> = (x) => this._client.listUsers(x)
  public getOrCreateUser: types.GetOrCreateUser<TIntegration> = ((x) =>
    this._client.getOrCreateUser(x)) as types.GetOrCreateUser<TIntegration>
  public updateUser: types.UpdateUser<TIntegration> = ((x) =>
    this._client.updateUser(x)) as types.UpdateUser<TIntegration>
  public deleteUser: types.DeleteUser<TIntegration> = (x) => this._client.deleteUser(x)

  public getState: types.GetState<TIntegration> = ((x) => this._client.getState(x)) as types.GetState<TIntegration>
  public setState: types.SetState<TIntegration> = ((x) => this._client.setState(x)) as types.SetState<TIntegration>
  public getOrSetState: types.GetOrSetState<TIntegration> = ((x) =>
    this._client.getOrSetState(x)) as types.GetOrSetState<TIntegration>
  public patchState: types.PatchState<TIntegration> = ((x) =>
    this._client.patchState(x)) as types.PatchState<TIntegration>

  public configureIntegration: types.ConfigureIntegration<TIntegration> = (x) => this._client.configureIntegration(x)

  public uploadFile: types.UploadFile<TIntegration> = (x) => this._client.uploadFile(x)
  public upsertFile: types.UpsertFile<TIntegration> = (x) => this._client.upsertFile(x)
  public deleteFile: types.DeleteFile<TIntegration> = (x) => this._client.deleteFile(x)
  public listFiles: types.ListFiles<TIntegration> = (x) => this._client.listFiles(x)
  public getFile: types.GetFile<TIntegration> = (x) => this._client.getFile(x)
  public updateFileMetadata: types.UpdateFileMetadata<TIntegration> = (x) => this._client.updateFileMetadata(x)
}
