import type { Client, Plugin } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreatePluginBody = utils.types.Merge<
  Parameters<Client['createPlugin']>[0],
  {
    code?: string
  }
>
export type UpdatePluginBody = Parameters<Client['updatePlugin']>[0]

export const prepareCreatePluginBody = async (plugin: sdk.PluginDefinition): Promise<CreatePluginBody> => ({
  name: plugin.name,
  version: plugin.version,
  user: {
    tags: plugin.user?.tags ?? {},
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
    ? await utils.records.mapValuesAsync(plugin.states, async (state) => ({
        ...state,
        schema: await utils.schema.mapZodToJsonSchema(state),
      }))
    : undefined,
})

export const prepareUpdatePluginBody = (localPlugin: UpdatePluginBody, remotePlugin: Plugin): UpdatePluginBody => {
  const actions = utils.records.setNullOnMissingValues(localPlugin.actions, remotePlugin.actions)
  const events = utils.records.setNullOnMissingValues(localPlugin.events, remotePlugin.events)
  const states = utils.records.setNullOnMissingValues(localPlugin.states, remotePlugin.states)

  return {
    ...localPlugin,
    actions,
    events,
    states,
    user: localPlugin.user, // TODO: allow deleting user tags with null
  }
}
