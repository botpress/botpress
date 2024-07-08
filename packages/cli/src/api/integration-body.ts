import type { Client, Integration } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreateIntegrationBody = Parameters<Client['createIntegration']>[0]
export type UpdateIntegrationBody = Parameters<Client['updateIntegration']>[0]

type UpdateIntegrationChannelsBody = NonNullable<UpdateIntegrationBody['channels']>
type UpdateIntegrationChannelBody = UpdateIntegrationChannelsBody[string]

type Channels = Integration['channels']
type Channel = Integration['channels'][string]

export const prepareCreateIntegrationBody = (integration: sdk.IntegrationDefinition): CreateIntegrationBody => ({
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
        schema: utils.schema.mapZodToJsonSchema(integration.configuration),
      }
    : undefined,
  events: integration.events
    ? utils.records.mapValues(integration.events, (event) => ({
        ...event,
        schema: utils.schema.mapZodToJsonSchema(event),
      }))
    : undefined,
  actions: integration.actions
    ? utils.records.mapValues(integration.actions, (action) => ({
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
    : undefined,
  channels: integration.channels
    ? utils.records.mapValues(integration.channels, (channel) => ({
        ...channel,
        messages: utils.records.mapValues(channel.messages, (message) => ({
          ...message,
          schema: utils.schema.mapZodToJsonSchema(message),
        })),
      }))
    : undefined,
  states: integration.states
    ? utils.records.mapValues(integration.states, (state) => ({
        ...state,
        schema: utils.schema.mapZodToJsonSchema(state),
      }))
    : undefined,
  entities: integration.entities
    ? utils.records.mapValues(integration.entities, (entity) => ({
        ...entity,
        schema: utils.schema.mapZodToJsonSchema(entity),
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

  return {
    ...localIntegration,
    actions,
    events,
    states,
    entities,
    user,
    channels,
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
