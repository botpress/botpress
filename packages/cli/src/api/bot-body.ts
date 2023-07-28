import type * as bpclient from '@botpress/client'
import * as utils from '../utils'

export type CreateBotBody = Parameters<bpclient.Client['createBot']>[0]
export type UpdateBotBody = Parameters<bpclient.Client['updateBot']>[0]

export const prepareUpdateBotBody = (localBot: UpdateBotBody, remoteBot: bpclient.Bot): UpdateBotBody => ({
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
