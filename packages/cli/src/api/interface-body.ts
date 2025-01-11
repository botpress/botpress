import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import * as utils from '../utils'
import * as types from './types'

export const prepareCreateInterfaceBody = async (
  intrface: sdk.InterfaceDefinition
): Promise<types.CreateInterfaceRequestBody> => ({
  name: intrface.name,
  version: intrface.version,
  entities: intrface.entities
    ? await utils.records.mapValuesAsync(intrface.entities, async (entity) => ({
        ...entity,
        schema: await utils.schema.mapZodToJsonSchema(entity),
      }))
    : {},
  events: intrface.events
    ? await utils.records.mapValuesAsync(intrface.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event),
      }))
    : {},
  actions: intrface.actions
    ? await utils.records.mapValuesAsync(intrface.actions, async (action) => ({
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
    : {},
  channels: intrface.channels
    ? await utils.records.mapValuesAsync(intrface.channels, async (channel) => ({
        ...channel,
        messages: await utils.records.mapValuesAsync(channel.messages, async (message) => ({
          ...message,
          schema: await utils.schema.mapZodToJsonSchema(message),
        })),
      }))
    : {},
})

/**
 * Guess the server's response body for an interface based on the request payload
 */
export const inferInterfaceResponseBody = (
  intrface: types.CreateInterfaceRequestBody
): types.InferredInterfaceResponseBody => {
  const now = new Date().toISOString()
  return {
    id: undefined,
    name: intrface.name,
    version: intrface.version,
    createdAt: now,
    updatedAt: now,
    actions: intrface.actions ?? {},
    events: intrface.events ?? {},
    channels: intrface.channels ?? {},
    entities: intrface.entities ?? {},
  }
}

export const prepareUpdateInterfaceBody = (
  localInterface: types.CreateInterfaceRequestBody & { id: string },
  remoteInterface: client.Interface
): types.UpdateInterfaceRequestBody => {
  const actions = utils.records.setNullOnMissingValues(localInterface.actions, remoteInterface.actions)
  const events = utils.records.setNullOnMissingValues(localInterface.events, remoteInterface.events)
  const entities = utils.records.setNullOnMissingValues(localInterface.entities, remoteInterface.entities)

  const currentChannels: types.UpdateInterfaceRequestBody['channels'] = localInterface.channels
    ? utils.records.mapValues(localInterface.channels, (channel, channelName) => ({
        ...channel,
        messages: utils.records.setNullOnMissingValues(
          channel?.messages,
          remoteInterface.channels[channelName]?.messages
        ),
      }))
    : undefined

  const channels = utils.records.setNullOnMissingValues(currentChannels, remoteInterface.channels)

  return {
    ...localInterface,
    entities,
    actions,
    events,
    channels,
  }
}
