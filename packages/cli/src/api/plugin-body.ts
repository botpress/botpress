import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import * as utils from '../utils'
import * as types from './types'

export const prepareCreatePluginBody = async (
  plugin: sdk.PluginDefinition | sdk.PluginPackage['definition']
): Promise<types.CreatePluginRequestBody> => ({
  name: plugin.name,
  version: plugin.version,
  title: 'title' in plugin ? plugin.title : undefined,
  description: 'description' in plugin ? plugin.description : undefined,
  user: {
    tags: plugin.user?.tags ?? {},
  },
  conversation: {
    tags: plugin.conversation?.tags ?? {},
  },
  configuration: plugin.configuration
    ? {
        ...plugin.configuration,
        schema: await utils.schema.mapZodToJsonSchema(plugin.configuration),
      }
    : undefined,
  events: plugin.events
    ? await utils.records.mapValuesAsync(plugin.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event),
      }))
    : undefined,
  actions: plugin.actions
    ? await utils.records.mapValuesAsync(plugin.actions, async (action) => ({
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
  states: plugin.states
    ? (utils.records.filterValues(
        await utils.records.mapValuesAsync(plugin.states, async (state) => ({
          ...state,
          schema: await utils.schema.mapZodToJsonSchema(state),
        })),
        ({ type }) => type !== 'workflow'
      ) as types.CreatePluginRequestBody['states'])
    : undefined,
  attributes: plugin.attributes,
})

export const prepareUpdatePluginBody = (
  localPlugin: types.UpdatePluginRequestBody,
  remotePlugin: client.Plugin
): types.UpdatePluginRequestBody => {
  const actions = utils.attributes.prepareAttributeUpdateBody({
    localItems: utils.records.setNullOnMissingValues(localPlugin.actions, remotePlugin.actions),
    remoteItems: remotePlugin.actions,
  })
  const events = utils.attributes.prepareAttributeUpdateBody({
    localItems: utils.records.setNullOnMissingValues(localPlugin.events, remotePlugin.events),
    remoteItems: remotePlugin.events,
  })
  const states = utils.records.setNullOnMissingValues(localPlugin.states, remotePlugin.states)

  const attributes = utils.records.setNullOnMissingValues(localPlugin.attributes, remotePlugin.attributes)

  return {
    ...localPlugin,
    actions,
    events,
    states,
    user: localPlugin.user, // TODO: allow deleting user tags with null
    attributes,
  }
}
