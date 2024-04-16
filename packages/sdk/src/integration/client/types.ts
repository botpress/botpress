import { Cast, Join } from '../../type-utils'
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

export type AsTags<T extends Record<string, string | undefined>> = Cast<T, Record<string, string>>

type PrefixConfig =
  | {
      allowPrefix: string
    }
  | {
      enforcePrefix: string
    }
  | null

export type WithPrefix<TTags extends string, TPrefix extends PrefixConfig = null> = TPrefix extends {
  allowPrefix: string
}
  ? TTags | Join<[TPrefix['allowPrefix'], ':', TTags]>
  : TPrefix extends { enforcePrefix: string }
  ? Join<[TPrefix['enforcePrefix'], ':', TTags]>
  : TTags

export type ToTags<TTags extends string | number | symbol> = AsTags<Partial<Record<Cast<TTags, string>, string>>>
