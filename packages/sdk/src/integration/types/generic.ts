import * as utils from '../../utils/type-utils'

export type BaseMessage = {
  tags: Record<string, any>
}

export type BaseConversation = {
  tags: Record<string, any>
}

export type BaseChannel = {
  messages: Record<string, any>
  message: BaseMessage
  conversation: BaseConversation
}

export type BaseUser = {
  tags: Record<string, any>
}

export type BaseAction = {
  input: any
  output: any
}

export type BaseIntegration = {
  name: string
  version: string
  configuration: any
  configurations: Record<string, any>
  actions: Record<string, BaseAction>
  channels: Record<string, BaseChannel>
  events: Record<string, any>
  states: Record<string, any>
  user: BaseUser
  entities: Record<string, any>
}

export type InputBaseChannel = utils.DeepPartial<BaseChannel>
export type DefaultChannel<C extends InputBaseChannel> = {
  messages: utils.Default<C['messages'], BaseChannel['messages']>
  message: utils.Default<C['message'], BaseChannel['message']>
  conversation: utils.Default<C['conversation'], BaseChannel['conversation']>
}

export type InputBaseIntegration = utils.DeepPartial<BaseIntegration>
export type DefaultIntegration<I extends InputBaseIntegration> = {
  name: utils.Default<I['name'], BaseIntegration['name']>
  version: utils.Default<I['version'], BaseIntegration['version']>
  configuration: utils.Default<I['configuration'], BaseIntegration['configuration']>
  configurations: utils.Default<I['configurations'], BaseIntegration['configurations']>
  actions: utils.Default<I['actions'], BaseIntegration['actions']>
  events: utils.Default<I['events'], BaseIntegration['events']>
  states: utils.Default<I['states'], BaseIntegration['states']>
  user: utils.Default<I['user'], BaseIntegration['user']>
  entities: utils.Default<I['entities'], BaseIntegration['entities']>
  channels: undefined extends I['channels']
    ? BaseIntegration['channels']
    : {
        [K in keyof I['channels']]: DefaultChannel<utils.Cast<I['channels'][K], InputBaseChannel>>
      }
}
