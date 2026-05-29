import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import * as errors from '../errors'
import * as utils from '../utils'
import * as types from './types'

export const prepareCreateInterfaceBody = async (
  intrface: sdk.InterfaceDefinition
): Promise<types.CreateInterfaceRequestBody> => {
  const base = `Failed to convert ZUI to JSON schema for interface ${intrface.name}`
  return {
    name: intrface.name,
    version: intrface.version,
    title: 'title' in intrface ? intrface.title : undefined,
    description: 'description' in intrface ? intrface.description : undefined,
    entities: intrface.entities
      ? await utils.records.mapValuesAsync(intrface.entities, async (entity, entityName) => ({
          ...entity,
          schema: await utils.schema
            .mapZodToJsonSchema(entity, {
              useLegacyZuiTransformer: intrface.__advanced?.useLegacyZuiTransformer,
              toJSONSchemaOptions: intrface.__advanced?.toJSONSchemaOptions,
            })
            .catch((thrown) => {
              throw errors.BotpressCLIError.wrap(thrown, `${base} for entity ${entityName}`)
            }),
        }))
      : {},
    events: intrface.events
      ? await utils.records.mapValuesAsync(intrface.events, async (event, eventName) => ({
          ...event,
          schema: await utils.schema
            .mapZodToJsonSchema(event, {
              useLegacyZuiTransformer: intrface.__advanced?.useLegacyZuiTransformer,
              toJSONSchemaOptions: intrface.__advanced?.toJSONSchemaOptions,
            })
            .catch((thrown) => {
              throw errors.BotpressCLIError.wrap(thrown, `${base} for event ${eventName}`)
            }),
        }))
      : {},
    actions: intrface.actions
      ? await utils.records.mapValuesAsync(intrface.actions, async (action, actionName) => ({
          ...action,
          input: {
            ...action.input,
            schema: await utils.schema
              .mapZodToJsonSchema(action.input, {
                useLegacyZuiTransformer: intrface.__advanced?.useLegacyZuiTransformer,
                toJSONSchemaOptions: intrface.__advanced?.toJSONSchemaOptions,
              })
              .catch((thrown) => {
                throw errors.BotpressCLIError.wrap(thrown, `${base} for action ${actionName} input`)
              }),
          },
          output: {
            ...action.output,
            schema: await utils.schema
              .mapZodToJsonSchema(action.output, {
                useLegacyZuiTransformer: intrface.__advanced?.useLegacyZuiTransformer,
                toJSONSchemaOptions: intrface.__advanced?.toJSONSchemaOptions,
              })
              .catch((thrown) => {
                throw errors.BotpressCLIError.wrap(thrown, `${base} for action ${actionName} output`)
              }),
          },
        }))
      : {},
    channels: intrface.channels
      ? await utils.records.mapValuesAsync(intrface.channels, async (channel, channelName) => ({
          ...channel,
          messages: await utils.records.mapValuesAsync(channel.messages, async (message, messageName) => ({
            ...message,
            schema: await utils.schema
              .mapZodToJsonSchema(message, {
                useLegacyZuiTransformer: intrface.__advanced?.useLegacyZuiTransformer,
                toJSONSchemaOptions: intrface.__advanced?.toJSONSchemaOptions,
              })
              .catch((thrown) => {
                throw errors.BotpressCLIError.wrap(
                  thrown,
                  `${base} for channel ${channelName} for message ${messageName}`
                )
              }),
          })),
        }))
      : {},
    attributes: intrface.attributes,
  }
}

export const prepareUpdateInterfaceBody = (
  localInterface: types.CreateInterfaceRequestBody & { id: string },
  remoteInterface: client.Interface
): types.UpdateInterfaceRequestBody => {
  const actions = utils.attributes.prepareAttributeUpdateBody({
    localItems: utils.records.setNullOnMissingValues(localInterface.actions, remoteInterface.actions),
    remoteItems: remoteInterface.actions,
  })
  const events = utils.attributes.prepareAttributeUpdateBody({
    localItems: utils.records.setNullOnMissingValues(localInterface.events, remoteInterface.events),
    remoteItems: remoteInterface.events,
  })
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

  const attributes = utils.records.setNullOnMissingValues(localInterface.attributes, remoteInterface.attributes)

  return {
    ...localInterface,
    entities,
    actions,
    events,
    channels,
    attributes,
  }
}
