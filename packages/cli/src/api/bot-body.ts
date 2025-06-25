import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import { PluginTagNames } from '../command-implementations/project-command'
import * as utils from '../utils'
import * as types from './types'

export const prepareCreateBotBody = async (bot: sdk.BotDefinition): Promise<types.CreateBotRequestBody> => ({
  user: bot.user,
  conversation: bot.conversation,
  message: bot.message,
  recurringEvents: bot.recurringEvents,
  actions: bot.actions
    ? await utils.records.mapValuesAsync(bot.actions, async (action) => ({
        ...action,
        input: {
          ...action.input,
          schema: await utils.schema.mapZodToJsonSchema(action.input),
        },
        output: {
          ...action.output,
          schema: await utils.schema.mapZodToJsonSchema(action.output),
        },
      }))
    : undefined,
  configuration: bot.configuration
    ? {
        ...bot.configuration,
        schema: await utils.schema.mapZodToJsonSchema(bot.configuration),
      }
    : undefined,
  events: bot.events
    ? await utils.records.mapValuesAsync(bot.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event),
      }))
    : undefined,
  states: bot.states
    ? (utils.records.filterValues(
        await utils.records.mapValuesAsync(bot.states, async (state) => ({
          ...state,
          schema: await utils.schema.mapZodToJsonSchema(state),
        })),
        ({ type }) => type !== 'workflow'
      ) as types.CreateBotRequestBody['states'])
    : undefined,
  tags: bot.attributes,
})

export const prepareUpdateBotBody = (
  localBot: types.UpdateBotRequestBody & PluginTagNames,
  remoteBot: client.Bot
): types.UpdateBotRequestBody => ({
  ...localBot,
  shouldMergePlugins: true,
  states: _setNullOnMissingValuesAndOmitPluginDefs(localBot.states, remoteBot.states),
  recurringEvents: _setNullOnMissingValuesAndOmitPluginDefs(localBot.recurringEvents, remoteBot.recurringEvents),
  events: utils.attributes.prepareAttributeUpdateBody({
    localItems: _setNullOnMissingValuesAndOmitPluginDefs(localBot.events, remoteBot.events),
    remoteItems: remoteBot.events,
  }),
  actions: utils.attributes.prepareAttributeUpdateBody({
    localItems: _setNullOnMissingValuesAndOmitPluginDefs(localBot.actions, remoteBot.actions),
    remoteItems: remoteBot.actions,
  }),
  user: {
    ...localBot.user,
    tags: _setNullOnMissingValuesAndOmitImmutableTags(
      localBot.user?.tags,
      remoteBot.user?.tags,
      localBot.immutableTags.user
    ),
  },
  conversation: {
    ...localBot.conversation,
    tags: _setNullOnMissingValuesAndOmitImmutableTags(
      localBot.conversation?.tags,
      remoteBot.conversation?.tags,
      localBot.immutableTags.conversation
    ),
  },
  message: {
    ...localBot.message,
    tags: _setNullOnMissingValuesAndOmitImmutableTags(
      localBot.message?.tags,
      remoteBot.message?.tags,
      localBot.immutableTags.message
    ),
  },
  integrations: _setNullOnMissingValuesAndOmitPluginDefs(localBot.integrations, remoteBot.integrations),
  plugins: _setNullOnMissingValuesAndOmitPluginDefs(localBot.plugins, remoteBot.plugins),
  tags: localBot.tags, // TODO: allow removing bot tags (aka attributes) by setting to null
})

export const _setNullOnMissingValuesAndOmitPluginDefs: typeof utils.records.setNullOnMissingValues = (
  record,
  oldRecord = {}
) =>
  utils.records.setNullOnMissingValues(
    record,
    Object.fromEntries(Object.entries(oldRecord).filter(([key]) => !key.includes('#')))
  )

export const _setNullOnMissingValuesAndOmitImmutableTags = <A, B>(
  record: Record<string, A> = {},
  oldRecord: Record<string, B> = {},
  immutableTags: string[] = []
): Record<string, A | null> =>
  utils.records.setNullOnMissingValues(
    record,
    Object.fromEntries(Object.entries(oldRecord).filter(([key]) => !immutableTags.includes(key)))
  )
