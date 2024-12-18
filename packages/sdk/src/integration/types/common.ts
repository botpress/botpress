import * as utils from '../../utils/type-utils'
import { BaseIntegration } from './generic'

type ActionDefinition = BaseIntegration['actions'][string]
type EventDefinition = BaseIntegration['events'][string]
type EntityDefinition = BaseIntegration['entities'][string]
type ChannelDefinition = BaseIntegration['channels'][string]

type AsTags<T extends Record<string, string | undefined>> = utils.Cast<T, Record<string, string>>
export type ToTags<TTags extends string | number | symbol> = AsTags<Partial<Record<utils.Cast<TTags, string>, string>>>

export type InterfaceExtension<
  TEntities extends Record<string, EntityDefinition> = Record<string, EntityDefinition>,
  TActions extends Record<string, ActionDefinition> = Record<string, ActionDefinition>,
  TEvents extends Record<string, EventDefinition> = Record<string, EventDefinition>,
  TChannels extends Record<string, ChannelDefinition> = Record<string, ChannelDefinition>
> = {
  id?: string
  name: string
  version: string
  entities: { [K in keyof TEntities]: { name: string } }
  actions: { [K in keyof TActions]: { name: string } }
  events: { [K in keyof TEvents]: { name: string } }
  channels: { [K in keyof TChannels]: { name: string } }
}
