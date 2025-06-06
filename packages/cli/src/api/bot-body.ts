import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
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
  localBot: types.UpdateBotRequestBody,
  remoteBot: client.Bot
): types.UpdateBotRequestBody => ({
  ...localBot,
  states: utils.records.setNullOnMissingValues(localBot.states, remoteBot.states),
  recurringEvents: utils.records.setNullOnMissingValues(localBot.recurringEvents, remoteBot.recurringEvents),
  events: utils.attributes.prepareAttributeUpdateBody({
    localItems: utils.records.setNullOnMissingValues(localBot.events, remoteBot.events),
    remoteItems: remoteBot.events,
  }),
  actions: utils.attributes.prepareAttributeUpdateBody({
    localItems: utils.records.setNullOnMissingValues(localBot.actions, remoteBot.actions),
    remoteItems: remoteBot.actions,
  }),
  user: {
    ...localBot.user,
    tags: utils.records.setNullOnMissingValues(localBot.user?.tags, remoteBot.user?.tags),
  },
  conversation: {
    ...localBot.conversation,
    tags: utils.records.setNullOnMissingValues(localBot.conversation?.tags, remoteBot.conversation?.tags),
  },
  message: {
    ...localBot.message,
    tags: utils.records.setNullOnMissingValues(localBot.message?.tags, remoteBot.message?.tags),
  },
  integrations: utils.records.setNullOnMissingValues(localBot.integrations, remoteBot.integrations),
  plugins: utils.records.setNullOnMissingValues(localBot.plugins, remoteBot.plugins),
  tags: localBot.tags, // TODO: allow removing bot tags (aka attributes) by setting to null
})
