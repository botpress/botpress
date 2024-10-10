import { ActionExecutorClass, ActionKey } from './actions/base-action-executor'
import { ApiFacadeClass } from './api-client/api-facade'
import { ChannelPublisherClass, ChannelKey, ChannelMessageType, ChannelProps } from './channels/base-channel-publisher'
import { WebhookHandlerClass } from './events/base-event-handler'
import { WebhookEventDispatcher } from './events/event-dispatcher'
import * as bp from '.botpress'

type RegisterFunction = bp.IntegrationProps['register']
type RegisterFunctionProps = Parameters<RegisterFunction>[0]
type UnregisterFunction = bp.IntegrationProps['unregister']
type UnregisterFunctionProps = Parameters<UnregisterFunction>[0]

export class IntegrationBuilder {
  private _registerFunctions: RegisterFunction[] = []
  private _unregisterFunctions: UnregisterFunction[] = []
  private _actionsExecutors: Record<ActionKey, ActionExecutorClass> = {} as any
  private _webhookEventHandlers: WebhookHandlerClass[] = []
  private _channelPublishers: Record<ChannelKey, Record<ChannelMessageType<ChannelKey>, ChannelPublisherClass>> =
    {} as any
  private _apiFacadeClass?: ApiFacadeClass

  public constructor() {
    void this.reset()
  }

  // Registration logic below:

  public reset() {
    this._registerFunctions = []
    this._unregisterFunctions = []
    this._actionsExecutors = {} as any
    this._webhookEventHandlers = []
    this._apiFacadeClass = undefined
    this._channelPublishers = {} as any
    return this
  }

  public addRegisterFunction(fn: RegisterFunction): this {
    this._registerFunctions.push(fn)
    return this
  }

  public addRegisterFunctions(fns: RegisterFunction[]): this {
    this._registerFunctions.push(...fns)
    return this
  }

  public addUnregisterFunction(fn: UnregisterFunction): this {
    this._unregisterFunctions.push(fn)
    return this
  }

  public addUnregisterFunctions(fns: UnregisterFunction[]): this {
    this._unregisterFunctions.push(...fns)
    return this
  }

  public addEventHandler(handler: WebhookHandlerClass): this {
    this._webhookEventHandlers.push(handler)
    return this
  }

  public addEventHandlers(handlers: WebhookHandlerClass[]): this {
    this._webhookEventHandlers.push(...handlers)
    return this
  }

  public addActionExecutor(action: ActionKey, actionClass: ActionExecutorClass): this {
    this._actionsExecutors[action] = actionClass
    return this
  }

  public addActionExecutors(actions: Record<ActionKey, ActionExecutorClass>): this {
    this._actionsExecutors = { ...this._actionsExecutors, ...actions }
    return this
  }

  public addChannelPublisher<K extends ChannelKey, T extends ChannelMessageType<K>>(
    channel: K,
    messageType: T,
    channelClass: ChannelPublisherClass
  ): this {
    if (!this._channelPublishers[channel]) {
      this._channelPublishers[channel] = {} as any
    }

    const publishers = this._channelPublishers[channel] as Record<ChannelMessageType<K>, ChannelPublisherClass>
    publishers[messageType] = channelClass

    return this
  }

  public addChannelPublishers<K extends ChannelKey, T extends ChannelMessageType<K>>(
    channel: K,
    messageTypes: Record<T, ChannelPublisherClass>
  ): this {
    for (const [messageType, channelClass] of Object.entries(messageTypes) as [T, ChannelPublisherClass][]) {
      this.addChannelPublisher(channel, messageType, channelClass)
    }

    return this
  }

  public setApiFacade(apiFacade: ApiFacadeClass): this {
    this._apiFacadeClass = apiFacade
    return this
  }

  // Build logic below:

  public build(): bp.Integration {
    return new bp.Integration(this._getProps())
  }

  private _getProps(): bp.IntegrationProps {
    const integrationProps: bp.IntegrationProps = {
      register: this._getRegister(),
      unregister: this._getUnregister(),
      handler: this._getHandler(),
      actions: this._getActions(),
      channels: this._getChannels(),
    }

    return integrationProps
  }

  private _getRegister(): bp.IntegrationProps['register'] {
    return async (props: RegisterFunctionProps): Promise<void> => {
      for (const registerFn of this._registerFunctions) {
        await registerFn(props)
      }
    }
  }

  private _getUnregister(): bp.IntegrationProps['unregister'] {
    return async (props: UnregisterFunctionProps): Promise<void> => {
      for (const unregisterFn of this._unregisterFunctions) {
        await unregisterFn(props)
      }
    }
  }

  private _getHandler(): bp.IntegrationProps['handler'] {
    return async (props: bp.HandlerProps): Promise<void> => {
      const eventDispatcher = new WebhookEventDispatcher({
        ...props,
        handlers: this._webhookEventHandlers,
        apiFacadeClass: this._apiFacadeClass,
      })

      await eventDispatcher.dispatch()
    }
  }

  private _getActions(): bp.IntegrationProps['actions'] {
    const actions: bp.IntegrationProps['actions'] = {} as any

    for (const [action, actionClass] of Object.entries(this._actionsExecutors) as [ActionKey, ActionExecutorClass][]) {
      actions[action] = async (props: bp.ActionProps[typeof action]) => {
        const actionInstance = new actionClass({ ...props, apiFacadeClass: this._apiFacadeClass })
        return await actionInstance.tryToExecute()
      }
    }

    return actions
  }

  private _getChannels(): bp.IntegrationProps['channels'] {
    const channels: bp.IntegrationProps['channels'] = {} as any

    for (const [channel, messageTypes] of Object.entries(this._channelPublishers) as [
      ChannelKey,
      Record<ChannelMessageType<ChannelKey>, ChannelPublisherClass>
    ][]) {
      channels[channel] = { messages: {} as any }

      for (const [messageType, channelClass] of Object.entries(messageTypes) as [
        ChannelMessageType<typeof channel>,
        ChannelPublisherClass
      ][]) {
        channels[channel].messages[messageType] = async (props: ChannelProps<typeof channel, typeof messageType>) => {
          const channelInstance = new channelClass({ ...props, apiFacadeClass: this._apiFacadeClass })
          return await channelInstance.tryToPublish()
        }
      }
    }

    return channels
  }
}
