import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import * as jsonSchema from 'json-schema'
import * as utils from '../utils'
import * as types from './types'

const DEFAULT_SCHEMA = { type: 'object', properties: {} } satisfies jsonSchema.JSONSchema7

export const prepareCreateIntegrationBody = async (
  integration: sdk.IntegrationDefinition
): Promise<types.CreateIntegrationRequestBody> => ({
  name: integration.name,
  version: integration.version,
  title: integration.title,
  description: integration.description,
  user: integration.user,
  events: integration.events
    ? await utils.records.mapValuesAsync(integration.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event),
      }))
    : undefined,
  actions: integration.actions
    ? await utils.records.mapValuesAsync(integration.actions, async (action) => ({
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
  channels: integration.channels
    ? await utils.records.mapValuesAsync(integration.channels, async (channel) => ({
        ...channel,
        messages: await utils.records.mapValuesAsync(channel.messages, async (message) => ({
          ...message,
          schema: await utils.schema.mapZodToJsonSchema(message),
        })),
      }))
    : undefined,
  states: integration.states
    ? await utils.records.mapValuesAsync(integration.states, async (state) => ({
        ...state,
        schema: await utils.schema.mapZodToJsonSchema(state),
      }))
    : undefined,
  entities: integration.entities
    ? await utils.records.mapValuesAsync(integration.entities, async (entity) => ({
        ...entity,
        schema: await utils.schema.mapZodToJsonSchema(entity),
      }))
    : undefined,
})

/**
 * Guess the server's response body for an integration based on the request payload
 */
export const inferIntegrationResponseBody = (
  integration: types.CreateIntegrationRequestBody
): types.InferredIntegrationResponseBody => {
  const now = new Date().toISOString()
  return {
    id: undefined,
    name: integration.name,
    version: integration.version,
    createdAt: now,
    updatedAt: now,
    iconUrl: '',
    readmeUrl: '',
    public: false,
    dev: false,
    url: '',
    verificationStatus: 'unapproved',
    title: integration.title ?? '',
    description: integration.description ?? '',
    identifier: integration.identifier ?? {},
    events: integration.events ?? {},
    actions: integration.actions ?? {},
    states: integration.states ?? {},
    entities: integration.entities ?? {},
    user: {
      creation: {
        enabled: integration.user?.creation?.enabled ?? false,
        requiredTags: integration.user?.creation?.requiredTags ?? [],
      },
      tags: integration.user?.tags ?? {},
    },
    secrets: Object.keys(integration.secrets ?? []),
    interfaces: utils.records.mapValues(
      integration.interfaces ?? {},
      (i): types.InferredIntegrationResponseBody['interfaces'][string] => ({
        id: i.id,
        name: i.name,
        version: i.version,
        entities: i.entities ?? {},
        actions: i.actions ?? {},
        channels: i.channels ?? {},
        events: i.events ?? {},
      })
    ),
    configuration: {
      title: integration.configuration?.title ?? '',
      description: integration.configuration?.description ?? '',
      schema: integration.configuration?.schema ?? DEFAULT_SCHEMA,
      identifier: {
        required: integration.configuration?.identifier?.required ?? false,
        linkTemplateScript: integration.configuration?.identifier?.linkTemplateScript ?? '',
      },
    },
    configurations: utils.records.mapValues(
      integration.configurations ?? {},
      (configuration): types.InferredIntegrationResponseBody['configurations'][string] => ({
        title: configuration.title ?? '',
        description: configuration.description ?? '',
        identifier: {
          required: configuration.identifier?.required ?? false,
          linkTemplateScript: configuration.identifier?.linkTemplateScript ?? '',
        },
        schema: configuration.schema ?? DEFAULT_SCHEMA,
      })
    ),
    channels: utils.records.mapValues(
      integration.channels ?? {},
      (channel): types.InferredIntegrationResponseBody['channels'][string] => ({
        title: channel.title ?? '',
        description: channel.description ?? '',
        conversation: {
          creation: {
            enabled: channel.conversation?.creation?.enabled ?? false,
            requiredTags: channel.conversation?.creation?.requiredTags ?? [],
          },
          tags: channel.conversation?.tags ?? {},
        },
        message: {
          tags: channel.message?.tags ?? {},
        },
        messages: utils.records.mapValues(
          channel.messages ?? {},
          (message): types.InferredIntegrationResponseBody['channels'][string]['messages'][string] => ({
            schema: message.schema ?? DEFAULT_SCHEMA,
          })
        ),
      })
    ),
  }
}

type UpdateIntegrationChannelsBody = NonNullable<types.UpdateIntegrationRequestBody['channels']>
type UpdateIntegrationChannelBody = UpdateIntegrationChannelsBody[string]
type Channels = client.Integration['channels']
type Channel = client.Integration['channels'][string]
export const prepareUpdateIntegrationBody = (
  localIntegration: types.UpdateIntegrationRequestBody,
  remoteIntegration: client.Integration
): types.UpdateIntegrationRequestBody => {
  const actions = utils.records.setNullOnMissingValues(localIntegration.actions, remoteIntegration.actions)
  const events = utils.records.setNullOnMissingValues(localIntegration.events, remoteIntegration.events)
  const states = utils.records.setNullOnMissingValues(localIntegration.states, remoteIntegration.states)
  const entities = utils.records.setNullOnMissingValues(localIntegration.entities, remoteIntegration.entities)
  const user = {
    ...localIntegration.user,
    tags: utils.records.setNullOnMissingValues(localIntegration.user?.tags, remoteIntegration.user?.tags),
  }

  const channels = _prepareUpdateIntegrationChannelsBody(localIntegration.channels ?? {}, remoteIntegration.channels)

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

const _prepareUpdateIntegrationChannelsBody = (
  localChannels: UpdateIntegrationChannelsBody,
  remoteChannels: Channels
): UpdateIntegrationChannelsBody => {
  const channelBody: UpdateIntegrationChannelsBody = {}

  const zipped = utils.records.zipObjects(localChannels, remoteChannels)
  for (const [channelName, [localChannel, remoteChannel]] of Object.entries(zipped)) {
    if (localChannel && remoteChannel) {
      // channel has to be updated
      channelBody[channelName] = _prepareUpdateIntegrationChannelBody(localChannel, remoteChannel)
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

const _prepareUpdateIntegrationChannelBody = (
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
