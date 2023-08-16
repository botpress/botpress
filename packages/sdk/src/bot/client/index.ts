import { Client } from '@botpress/client'
import { BaseBot } from '../generic'
import * as routes from './routes'

/**
 * Just like the regular botpress client, but typed with the bot's properties.
 */
export class BotSpecificClient<TBot extends BaseBot> {
  public constructor(private readonly client: Client) {}

  public createConversation: routes.CreateConversation<TBot> = (x) => this.client.createConversation(x)
  public getConversation: routes.GetConversation<TBot> = (x) => this.client.getConversation(x)
  public listConversations: routes.ListConversations<TBot> = (x) => this.client.listConversations(x)
  public getOrCreateConversation: routes.GetOrCreateConversation<TBot> = (x) => this.client.getOrCreateConversation(x)
  public updateConversation: routes.UpdateConversation<TBot> = (x) => this.client.updateConversation(x)
  public deleteConversation: routes.DeleteConversation<TBot> = (x) => this.client.deleteConversation(x)

  public createEvent: routes.CreateEvent<TBot> = (x) => this.client.createEvent(x)
  public getEvent: routes.GetEvent<TBot> = (x) => this.client.getEvent(x)
  public listEvents: routes.ListEvents<TBot> = (x) => this.client.listEvents(x)

  public createMessage: routes.CreateMessage<TBot> = (x) => this.client.createMessage(x)
  public getOrCreateMessage: routes.GetOrCreateMessage<TBot> = (x) => this.client.getOrCreateMessage(x)
  public getMessage: routes.GetMessage<TBot> = (x) => this.client.getMessage(x)
  public updateMessage: routes.UpdateMessage<TBot> = (x) => this.client.updateMessage(x)
  public listMessages: routes.ListMessages<TBot> = (x) => this.client.listMessages(x)
  public deleteMessage: routes.DeleteMessage<TBot> = (x) => this.client.deleteMessage(x)

  public createUser: routes.CreateUser<TBot> = (x) => this.client.createUser(x)
  public getUser: routes.GetUser<TBot> = (x) => this.client.getUser(x)
  public listUsers: routes.ListUsers<TBot> = (x) => this.client.listUsers(x)
  public getOrCreateUser: routes.GetOrCreateUser<TBot> = (x) => this.client.getOrCreateUser(x)
  public updateUser: routes.UpdateUser<TBot> = (x) => this.client.updateUser(x)
  public deleteUser: routes.DeleteUser<TBot> = (x) => this.client.deleteUser(x)

  public getState: routes.GetState<TBot> = (x) => this.client.getState(x)
  public setState: routes.SetState<TBot> = (x) => this.client.setState(x)
  public patchState: routes.PatchState<TBot> = (x) => this.client.patchState(x)

  public callAction: routes.CallAction<TBot> = (x) => this.client.callAction(x)
}
