import { Client } from '@botpress/client'
import { BaseBot } from '../generic'
import * as routes from './routes'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends BaseBot> {
  public constructor(private readonly client: Client) {}

  public getConversation: routes.GetConversation<TBot> = (x) => this.client.getConversation(x)
  public listConversations: routes.ListConversations<TBot> = (x) => this.client.listConversations(x)
  public updateConversation: routes.UpdateConversation<TBot> = (x) => this.client.updateConversation(x)
  public deleteConversation: routes.DeleteConversation<TBot> = (x) => this.client.deleteConversation(x)

  public listParticipants: routes.ListParticipants<TBot> = (x) => this.client.listParticipants(x)
  public addParticipant: routes.AddParticipant<TBot> = (x) => this.client.addParticipant(x)
  public getParticipant: routes.GetParticipant<TBot> = (x) => this.client.getParticipant(x)
  public removeParticipant: routes.RemoveParticipant<TBot> = (x) => this.client.removeParticipant(x)

  public getEvent: routes.GetEvent<TBot> = ((x) => this.client.getEvent(x)) as routes.GetEvent<TBot>
  public listEvents: routes.ListEvents<TBot> = ((x) => this.client.listEvents(x)) as routes.ListEvents<TBot>

  public createMessage: routes.CreateMessage<TBot> = ((x) => this.client.createMessage(x)) as routes.CreateMessage<TBot>
  public getOrCreateMessage: routes.GetOrCreateMessage<TBot> = ((x) =>
    this.client.getOrCreateMessage(x)) as routes.GetOrCreateMessage<TBot>
  public getMessage: routes.GetMessage<TBot> = ((x) => this.client.getMessage(x)) as routes.GetMessage<TBot>
  public updateMessage: routes.UpdateMessage<TBot> = ((x) => this.client.updateMessage(x)) as routes.UpdateMessage<TBot>
  public listMessages: routes.ListMessages<TBot> = ((x) => this.client.listMessages(x)) as routes.ListMessages<TBot>
  public deleteMessage: routes.DeleteMessage<TBot> = ((x) => this.client.deleteMessage(x)) as routes.DeleteMessage<TBot>

  public getUser: routes.GetUser<TBot> = (x) => this.client.getUser(x)
  public listUsers: routes.ListUsers<TBot> = (x) => this.client.listUsers(x)
  public updateUser: routes.UpdateUser<TBot> = (x) => this.client.updateUser(x)
  public deleteUser: routes.DeleteUser<TBot> = (x) => this.client.deleteUser(x)

  public getState: routes.GetState<TBot> = ((x) =>
    this.client.getState(x).then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.GetState<TBot>
  public setState: routes.SetState<TBot> = ((x) =>
    this.client.setState(x).then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.SetState<TBot>
  public getOrSetState: routes.GetOrSetState<TBot> = ((x) =>
    this.client
      .getOrSetState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.GetOrSetState<TBot>
  public patchState: routes.PatchState<TBot> = ((x) =>
    this.client
      .patchState(x)
      .then((y) => ({ state: { ...y.state, payload: y.state.payload } }))) as routes.PatchState<TBot>

  public callAction: routes.CallAction<TBot> = (x) => this.client.callAction(x)

  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public createConversation: routes.CreateConversation<TBot> = (x) => this.client.createConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the conversation creation to an integration.
   */
  public getOrCreateConversation: routes.GetOrCreateConversation<TBot> = (x) => this.client.getOrCreateConversation(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public createUser: routes.CreateUser<TBot> = (x) => this.client.createUser(x)
  /**
   * @deprecated Use `callAction` to delegate the user creation to an integration.
   */
  public getOrCreateUser: routes.GetOrCreateUser<TBot> = (x) => this.client.getOrCreateUser(x)
}
