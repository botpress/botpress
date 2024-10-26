import * as utils from '../utils/type-utils'

export type BaseIntegration = {
  name: string
  version: string
  configuration: any
  configurations: Record<string, any>
  actions: Record<string, Record<'input' | 'output', any>>
  channels: Record<
    string,
    {
      messages: Record<string, any>
      message: {
        tags: Record<string, any>
      }
      conversation: {
        tags: Record<string, any>
        creation: {
          enabled: boolean
          requiredTags: string[]
        }
      }
    }
  >
  events: Record<string, any>
  states: Record<string, any>
  user: {
    tags: Record<string, any>
    creation: {
      enabled: boolean
      requiredTags: string[]
    }
  }
  entities: Record<string, any>
}

export type MakeChannel<C extends Partial<BaseIntegration['channels'][string]>> = {
  messages: utils.Default<C['messages'], BaseIntegration['channels'][string]['messages']>
  message: utils.Default<C['message'], BaseIntegration['channels'][string]['message']>
  conversation: utils.Default<C['conversation'], BaseIntegration['channels'][string]['conversation']>
}

export type MakeIntegration<I extends Partial<BaseIntegration>> = {
  name: utils.Default<I['name'], BaseIntegration['name']>
  version: utils.Default<I['version'], BaseIntegration['version']>
  configuration: utils.Default<I['configuration'], BaseIntegration['configuration']>
  configurations: utils.Default<I['configurations'], BaseIntegration['configurations']>
  actions: utils.Default<I['actions'], BaseIntegration['actions']>
  channels: utils.Default<I['channels'], BaseIntegration['channels']>
  events: utils.Default<I['events'], BaseIntegration['events']>
  states: utils.Default<I['states'], BaseIntegration['states']>
  user: utils.Default<I['user'], BaseIntegration['user']>
  entities: utils.Default<I['entities'], BaseIntegration['entities']>
}

type _MakeChannel_creates_a_TChannel = utils.AssertExtends<BaseIntegration['channels'][string], MakeChannel<{}>>
type _MakeIntegration_creates_a_TIntegration = utils.AssertExtends<BaseIntegration, MakeIntegration<{}>>
