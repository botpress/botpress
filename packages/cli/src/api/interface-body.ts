import type { Client, Interface } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreateInterfaceBody = Parameters<Client['createInterface']>[0]
export type UpdateInterfaceBody = Parameters<Client['updateInterface']>[0]

export const prepareCreateInterfaceBody = async (intrface: sdk.InterfaceDefinition): Promise<CreateInterfaceBody> => ({
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

export const prepareUpdateInterfaceBody = (
  localInterface: CreateInterfaceBody & { id: string },
  remoteInterface: Interface
): UpdateInterfaceBody => {
  const actions = utils.records.setNullOnMissingValues(localInterface.actions, remoteInterface.actions)
  const events = utils.records.setNullOnMissingValues(localInterface.events, remoteInterface.events)
  const entities = utils.records.setNullOnMissingValues(localInterface.entities, remoteInterface.entities)

  const currentChannels: UpdateInterfaceBody['channels'] = localInterface.channels
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
