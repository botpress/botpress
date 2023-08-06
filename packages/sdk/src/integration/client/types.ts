import { Cast } from '../../type-utils'
import { IntegrationImplementation as Integration } from '../implementation'

// type Def<T> = NonNullable<T>

export type Tof<I extends Integration> = I extends Integration<infer D> ? D : never

export type Definition = Tof<Integration>
export type ConfigurationDefinition = Definition['configuration']
export type ActionDefinition = Definition['actions'][string]
export type ChannelDefinition = Definition['channels'][string]
export type EventDefinition = Definition['events'][string]
export type StateDefinition = Definition['states'][string]
export type UserDefinition = Definition['user']

export type GetChannelByName<
  TIntegration extends Integration<any>,
  TChannelName extends keyof Tof<TIntegration>['channels']
> = Cast<Tof<TIntegration>['channels'][TChannelName], ChannelDefinition>
