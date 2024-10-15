import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreateBotBody = Parameters<client.Client['createBot']>[0]
export type UpdateBotBody = Parameters<client.Client['updateBot']>[0]

export const prepareCreateBotBody = async (bot: sdk.BotDefinition): Promise<CreateBotBody> => ({
  ...bot.props,
  configuration: bot.props.configuration
    ? {
        ...bot.props.configuration,
        schema: await utils.schema.mapZodToJsonSchema(bot.props.configuration),
      }
    : undefined,
  events: bot.props.events
    ? await utils.records.mapValuesAsync(bot.props.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event),
      }))
    : undefined,
  states: bot.props.states
    ? await utils.records.mapValuesAsync(bot.props.states, async (state) => ({
        ...state,
        schema: await utils.schema.mapZodToJsonSchema(state),
      }))
    : undefined,
})

export const prepareUpdateBotBody = (localBot: UpdateBotBody, remoteBot: client.Bot): UpdateBotBody => ({
  ...localBot,
  states: utils.records.setNullOnMissingValues(localBot.states, remoteBot.states),
  recurringEvents: utils.records.setNullOnMissingValues(localBot.recurringEvents, remoteBot.recurringEvents),
  events: utils.records.setNullOnMissingValues(localBot.events, remoteBot.events),
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
})
