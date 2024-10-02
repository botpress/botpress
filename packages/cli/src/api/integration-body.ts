import type { Client, Integration } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import { ZodToJsonOptions } from 'src/utils/schema-utils'
import * as utils from '../utils'

export type CreateIntegrationBody = Parameters<Client['createIntegration']>[0]
export type UpdateIntegrationBody = Parameters<Client['updateIntegration']>[0]

type UpdateIntegrationChannelsBody = NonNullable<UpdateIntegrationBody['channels']>
type UpdateIntegrationChannelBody = UpdateIntegrationChannelsBody[string]

type Channels = Integration['channels']
type Channel = Integration['channels'][string]

export const prepareCreateIntegrationBody = async (
  integration: sdk.IntegrationDefinition,
  options: ZodToJsonOptions = {}
): Promise<CreateIntegrationBody> => ({
  name: integration.name,
  version: integration.version,
  title: integration.title,
  description: integration.description,
  icon: integration.icon,
  readme: integration.readme,
  user: integration.user,
  identifier: integration.identifier,
  secrets: undefined,
  interfaces: {},
  configuration: integration.configuration
    ? {
        ...integration.configuration,
        schema: await utils.schema.mapZodToJsonSchema(integration.configuration, options),
      }
    : undefined,
  configurations: integration.configurations
    ? await utils.records.mapValuesAsync(integration.configurations, async (configuration) => ({
        ...configuration,
        schema: await utils.schema.mapZodToJsonSchema(configuration, options),
      }))
    : undefined,
  events: integration.events
    ? await utils.records.mapValuesAsync(integration.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event, options),
      }))
    : undefined,
  actions: integration.actions
    ? await utils.records.mapValuesAsync(integration.actions, async (action) => ({
        ...action,
        input: {
          ...action.input,
          schema: await utils.schema.mapZodToJsonSchema(action.input, options),
        },
        output: {
          ...action.output,
          schema: await utils.schema.mapZodToJsonSchema(action.output, options),
        },
      }))
    : undefined,
  channels: integration.channels
    ? await utils.records.mapValuesAsync(integration.channels, async (channel) => ({
        ...channel,
        messages: await utils.records.mapValuesAsync(channel.messages, async (message) => ({
          ...message,
          schema: await utils.schema.mapZodToJsonSchema(message, options),
        })),
      }))
    : undefined,
  states: integration.states
    ? await utils.records.mapValuesAsync(integration.states, async (state) => ({
        ...state,
        schema: await utils.schema.mapZodToJsonSchema(state, options),
      }))
    : undefined,
  entities: integration.entities
    ? await utils.records.mapValuesAsync(integration.entities, async (entity) => ({
        ...entity,
        schema: await utils.schema.mapZodToJsonSchema(entity, options),
      }))
    : undefined,
})

export const prepareUpdateIntegrationBody = (
  localIntegration: UpdateIntegrationBody,
  remoteIntegration: Integration
): UpdateIntegrationBody => {
  const actions = utils.records.setNullOnMissingValues(localIntegration.actions, remoteIntegration.actions)
  const events = utils.records.setNullOnMissingValues(localIntegration.events, remoteIntegration.events)
  const states = utils.records.setNullOnMissingValues(localIntegration.states, remoteIntegration.states)
  const entities = utils.records.setNullOnMissingValues(localIntegration.entities, remoteIntegration.entities)
  const user = {
    ...localIntegration.user,
    tags: utils.records.setNullOnMissingValues(localIntegration.user?.tags, remoteIntegration.user?.tags),
  }

  const channels = prepareUpdateIntegrationChannelsBody(localIntegration.channels ?? {}, remoteIntegration.channels)

  const interfaces = utils.records.setNullOnMissingValues(localIntegration.interfaces, remoteIntegration.interfaces)

  const configurations = utils.records.setNullOnMissingValues(
    localIntegration.configurations,
    remoteIntegration.configurations
  )

  return {
    ...localIntegration,
    actions,
    events,
    states,
    entities,
    user,
    channels,
    interfaces,
    configurations,
  }
}

const prepareUpdateIntegrationChannelsBody = (
  localChannels: UpdateIntegrationChannelsBody,
  remoteChannels: Channels
): UpdateIntegrationChannelsBody => {
  const channelBody: UpdateIntegrationChannelsBody = {}

  const zipped = utils.records.zipObjects(localChannels, remoteChannels)
  for (const [channelName, [localChannel, remoteChannel]] of Object.entries(zipped)) {
    if (localChannel && remoteChannel) {
      // channel has to be updated
      channelBody[channelName] = prepareUpdateIntegrationChannelBody(localChannel, remoteChannel)
    } else if (localChannel) {
      // channel has to be created
      channelBody[channelName] = localChannel
      continue
    } else if (remoteChannel) {
      // channel has to be deleted
      channelBody[channelName] = null
      continue
    }
  }

  return channelBody
}

const prepareUpdateIntegrationChannelBody = (
  localChannel: UpdateIntegrationChannelBody,
  remoteChannel: Channel
): UpdateIntegrationChannelBody => ({
  ...localChannel,
  messages: utils.records.setNullOnMissingValues(localChannel?.messages, remoteChannel.messages),
  message: {
    ...localChannel?.message,
    tags: utils.records.setNullOnMissingValues(localChannel?.message?.tags, remoteChannel.message.tags),
  },
  conversation: {
    ...localChannel?.conversation,
    tags: utils.records.setNullOnMissingValues(localChannel?.conversation?.tags, remoteChannel.conversation.tags),
  },
})
