import * as utils from '../../utils/type-utils'
import * as common from '../common'

export type EnumerateMessages<TIntegration extends common.BaseIntegration> = utils.UnionToIntersection<
  utils.ValueOf<{
    [TChannelName in keyof TIntegration['channels']]: {
      [TMessageName in keyof TIntegration['channels'][TChannelName]['messages']]: {
        tags: TIntegration['channels'][TChannelName]['message']['tags']
        payload: TIntegration['channels'][TChannelName]['messages'][TMessageName]
      }
    }
  }>
>

export type GetChannelByName<
  TIntegration extends common.BaseIntegration,
  TChannelName extends keyof TIntegration['channels'],
> = utils.Cast<TIntegration['channels'][TChannelName], common.BaseChannel>

export type GetMessageByName<
  TIntegration extends common.BaseIntegration,
  TMessageName extends keyof EnumerateMessages<TIntegration>,
> = utils.Cast<
  EnumerateMessages<TIntegration>[TMessageName],
  {
    tags: Record<string, any>
    payload: any
  }
>

export type ConversationTags<TIntegration extends common.BaseIntegration> = keyof utils.UnionToIntersection<
  utils.ValueOf<{
    [TChannelName in keyof TIntegration['channels']]: TIntegration['channels'][TChannelName]['conversation']['tags']
  }>
>

export type MessageTags<TIntegration extends common.BaseIntegration> = keyof utils.UnionToIntersection<
  utils.ValueOf<{
    [TChannelName in keyof TIntegration['channels']]: TIntegration['channels'][TChannelName]['message']['tags']
  }>
>

/**
 * @deprecated Integration's should no longer use their name as prefix for event types or tags.
 */
export type WithRequiredPrefix<TTags extends string, TPrefix extends string> = string extends TTags
  ? string
  : utils.Join<[TPrefix, ':', TTags]>

/**
 * @deprecated Integration's should no longer use their name as prefix for event types or tags.
 */
export type WithOptionalPrefix<TTags extends string, TPrefix extends string> =
  | TTags
  | WithRequiredPrefix<TTags, TPrefix>
