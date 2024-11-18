import type { Server } from 'node:http'
import { serve } from '../serve'
import {
  RegisterHandler as RegisterFunction,
  UnregisterHandler as UnregisterFunction,
  WebhookHandler as WebhookFunction,
  CreateUserHandler as CreateUserFunction,
  CreateConversationHandler as CreateConversationFunction,
  ActionHandlers as ActionFunctions,
  ChannelHandlers as ChannelFunctions,
  integrationHandler,
} from './server'
import { BaseIntegration } from './types'

export type IntegrationImplementationProps<TIntegration extends BaseIntegration = BaseIntegration> = {
  register: RegisterFunction<TIntegration>
  unregister: UnregisterFunction<TIntegration>
  handler: WebhookFunction<TIntegration>
  /**
   * @deprecated
   */
  createUser?: CreateUserFunction<TIntegration>
  /**
   * @deprecated
   */
  createConversation?: CreateConversationFunction<TIntegration>
  actions: ActionFunctions<TIntegration>
  channels: ChannelFunctions<TIntegration>
}

export class IntegrationImplementation<TIntegration extends BaseIntegration = BaseIntegration> {
  public readonly actions: IntegrationImplementationProps<TIntegration>['actions']
  public readonly channels: IntegrationImplementationProps<TIntegration>['channels']
  public readonly register: IntegrationImplementationProps<TIntegration>['register']
  public readonly unregister: IntegrationImplementationProps<TIntegration>['unregister']
  public readonly createUser: IntegrationImplementationProps<TIntegration>['createUser']
  public readonly createConversation: IntegrationImplementationProps<TIntegration>['createConversation']
  public readonly webhook: IntegrationImplementationProps<TIntegration>['handler']

  public constructor(public readonly props: IntegrationImplementationProps<TIntegration>) {
    this.actions = props.actions
    this.channels = props.channels
    this.register = props.register
    this.unregister = props.unregister
    this.createUser = props.createUser
    this.createConversation = props.createConversation
    this.webhook = props.handler
  }

  public readonly handler = integrationHandler(this as IntegrationImplementation<any>)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}
