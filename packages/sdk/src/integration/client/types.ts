import { Cast } from '../../type-utils'
import { BaseIntegration } from '../generic'

export type ConfigurationDefinition = BaseIntegration['configuration']
export type ActionDefinition = BaseIntegration['actions'][string]
export type ChannelDefinition = BaseIntegration['channels'][string]
export type EventDefinition = BaseIntegration['events'][string]
export type StateDefinition = BaseIntegration['states'][string]
export type UserDefinition = BaseIntegration['user']

export type GetChannelByName<
  TIntegration extends BaseIntegration,
  TChannelName extends keyof TIntegration['channels']
> = Cast<TIntegration['channels'][TChannelName], ChannelDefinition>
