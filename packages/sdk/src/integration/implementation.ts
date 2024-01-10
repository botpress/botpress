import type { Server } from 'node:http'
import { serve } from '../serve'
import { BaseIntegration } from './generic'
import {
  RegisterFunction,
  UnregisterFunction,
  WebhookFunction,
  CreateUserFunction,
  CreateConversationFunction,
  ActionFunctions,
  ChannelFunctions,
  integrationHandler,
} from './server'

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
  public readonly props: IntegrationImplementationProps<TIntegration>
  public readonly actions: IntegrationImplementationProps<TIntegration>['actions']
  public readonly channels: IntegrationImplementationProps<TIntegration>['channels']
  public readonly register: IntegrationImplementationProps<TIntegration>['register']
  public readonly unregister: IntegrationImplementationProps<TIntegration>['unregister']
  public readonly createUser: IntegrationImplementationProps<TIntegration>['createUser']
  public readonly createConversation: IntegrationImplementationProps<TIntegration>['createConversation']
  public readonly webhook: IntegrationImplementationProps<TIntegration>['handler']

  public constructor(props: IntegrationImplementationProps<TIntegration>) {
    this.props = props
    this.actions = props.actions
    this.channels = props.channels
    this.register = props.register
    this.unregister = props.unregister
    this.createUser = props.createUser
    this.createConversation = props.createConversation
    this.webhook = props.handler
  }

  public readonly handler = integrationHandler<TIntegration>(this)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}
