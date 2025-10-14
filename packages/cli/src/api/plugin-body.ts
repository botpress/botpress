import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import * as utils from '../utils'
import * as types from './types'

export const prepareCreatePluginBody = async (
  plugin: sdk.PluginDefinition
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
        schema: await utils.schema.mapZodToJsonSchema(plugin.configuration, {
          useLegacyZuiTransformer: plugin.__advanced?.useLegacyZuiTransformer,
        }),
      }
    : undefined,
  events: plugin.events
    ? await utils.records.mapValuesAsync(plugin.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(event, {
          useLegacyZuiTransformer: plugin.__advanced?.useLegacyZuiTransformer,
        }),
      }))
    : undefined,
  actions: plugin.actions
    ? await utils.records.mapValuesAsync(plugin.actions, async (action) => ({
        ...action,
        input: {
          ...action.input,
          schema: await utils.schema.mapZodToJsonSchema(action.input, {
            useLegacyZuiTransformer: plugin.__advanced?.useLegacyZuiTransformer,
          }),
        },
        output: {
          ...action.output,
          schema: await utils.schema.mapZodToJsonSchema(action.output, {
            useLegacyZuiTransformer: plugin.__advanced?.useLegacyZuiTransformer,
          }),
        },
      }))
    : undefined,
  states: plugin.states
    ? (utils.records.filterValues(
        await utils.records.mapValuesAsync(plugin.states, async (state) => ({
          ...state,
          schema: await utils.schema.mapZodToJsonSchema(state, {
            useLegacyZuiTransformer: plugin.__advanced?.useLegacyZuiTransformer,
          }),
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

  const dependencies: types.UpdatePluginRequestBody['dependencies'] = {
    integrations: utils.records.setNullOnMissingValues(
      localPlugin.dependencies?.integrations,
      remotePlugin.dependencies?.integrations
    ),
    interfaces: utils.records.setNullOnMissingValues(
      localPlugin.dependencies?.interfaces,
      remotePlugin.dependencies?.interfaces
    ),
  }

  return {
    ...localPlugin,
    actions,
    events,
    states,
    user: localPlugin.user, // TODO: allow deleting user tags with null
    attributes,
    dependencies,
  }
}
