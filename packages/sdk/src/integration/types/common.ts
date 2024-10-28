import * as utils from '../../utils/type-utils'
import { BaseIntegration } from './generic'

export type ConfigurationDefinition = BaseIntegration['configuration']
export type ActionDefinition = BaseIntegration['actions'][string]
export type ChannelDefinition = BaseIntegration['channels'][string]
export type EventDefinition = BaseIntegration['events'][string]
export type StateDefinition = BaseIntegration['states'][string]
export type UserDefinition = BaseIntegration['user']

type AsTags<T extends Record<string, string | undefined>> = utils.Cast<T, Record<string, string>>
export type ToTags<TTags extends string | number | symbol> = AsTags<Partial<Record<utils.Cast<TTags, string>, string>>>
