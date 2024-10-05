import type { Client, Interface } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreateInterfaceBody = Parameters<Client['createInterface']>[0]
export type UpdateInterfaceBody = Parameters<Client['updateInterface']>[0]

export const prepareCreateInterfaceBody = (intrface: sdk.InterfaceDeclaration): CreateInterfaceBody => ({
  name: intrface.name,
  version: intrface.version,
  entities: intrface.entities
    ? utils.records.mapValues(intrface.entities, (entity) => ({
        ...entity,
        schema: utils.schema.mapZodToJsonSchema(entity),
      }))
    : {},
  events: intrface.events
    ? utils.records.mapValues(intrface.events, (event) => ({
        ...event,
        schema: utils.schema.mapZodToJsonSchema(event),
      }))
    : {},
  actions: intrface.actions
    ? utils.records.mapValues(intrface.actions, (action) => ({
        ...action,
        input: {
          ...action.input,
          schema: utils.schema.mapZodToJsonSchema(action.input),
        },
        output: {
          ...action.output,
          schema: utils.schema.mapZodToJsonSchema(action.output),
        },
      }))
    : {},
  channels: intrface.channels
    ? utils.records.mapValues(intrface.channels, (channel) => ({
        ...channel,
        messages: utils.records.mapValues(channel.messages, (message) => ({
          ...message,
          schema: utils.schema.mapZodToJsonSchema(message),
        })),
      }))
    : {},
  nameTemplate: intrface.templateName
    ? {
        script: intrface.templateName,
        language: 'handlebars',
      }
    : undefined,
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
