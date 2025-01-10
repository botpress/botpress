import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreateIntegrationBody = Parameters<client.Client['createIntegration']>[0]
export type UpdateIntegrationBody = Parameters<client.Client['updateIntegration']>[0]
export type InferredIntegrationResponseBody = utils.types.Merge<client.Integration, { id?: undefined }>

type UpdateIntegrationChannelsBody = NonNullable<UpdateIntegrationBody['channels']>
type UpdateIntegrationChannelBody = UpdateIntegrationChannelsBody[string]

type Channels = client.Integration['channels']
type Channel = client.Integration['channels'][string]

export const prepareCreateIntegrationBody = async (
  integration: sdk.IntegrationDefinition
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
        schema: await utils.schema.mapZodToJsonSchema(integration.configuration),
      }
    : undefined,
  configurations: integration.configurations
    ? await utils.records.mapValuesAsync(integration.configurations, async (configuration) => ({
        ...configuration,
        schema: await utils.schema.mapZodToJsonSchema(configuration),
      }))
    : undefined,
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
 * What would be the server response for a given CreateIntegration request
 */
export const inferIntegrationResponseBody = async (
  integration: sdk.IntegrationDefinition
): Promise<InferredIntegrationResponseBody> => {
  const createBody = await prepareCreateIntegrationBody(integration)
  const now = new Date().toISOString()
  return {
    id: undefined,
    name: createBody.name,
    version: createBody.version,
    createdAt: now,
    updatedAt: now,
    iconUrl: '',
    readmeUrl: '',
    public: false,
    dev: false,
    url: '',
    verificationStatus: 'unapproved',
    title: createBody.title ?? '',
    description: createBody.description ?? '',
    identifier: createBody.identifier ?? {},
    events: createBody.events ?? {},
    actions: createBody.actions ?? {},
    states: createBody.states ?? {},
    entities: createBody.entities ?? {},
    user: {
      creation: {
        enabled: createBody.user?.creation?.enabled ?? false,
        requiredTags: createBody.user?.creation?.requiredTags ?? [],
      },
      tags: createBody.user?.tags ?? {},
    },
    secrets: Object.keys(createBody.secrets ?? []),
    interfaces: {}, // TODO: fill interfaces
    configuration: {
      title: createBody.configuration?.title ?? '',
      description: createBody.configuration?.description ?? '',
      schema: createBody.configuration?.schema ?? {},
      identifier: {
        required: createBody.configuration?.identifier?.required ?? false,
        linkTemplateScript: createBody.configuration?.identifier?.linkTemplateScript ?? '',
      },
    },
    configurations: utils.records.mapValues(
      createBody.configurations ?? {},
      (configuration): client.Integration['configurations'][string] => ({
        title: configuration.title ?? '',
        description: configuration.description ?? '',
        identifier: {
          required: configuration.identifier?.required ?? false,
          linkTemplateScript: configuration.identifier?.linkTemplateScript ?? '',
        },
        schema: configuration.schema ?? {},
      })
    ),
    channels: utils.records.mapValues(createBody.channels ?? {}, (channel): client.Integration['channels'][string] => ({
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
        (message): client.Integration['channels'][string]['messages'][string] => ({
          schema: message.schema ?? {},
        })
      ),
    })),
  }
}

export const prepareUpdateIntegrationBody = (
  localIntegration: UpdateIntegrationBody,
  remoteIntegration: client.Integration
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
