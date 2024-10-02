import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import * as utils from '../utils'
import * as types from './typings'

export namespace from {
  export const sdk = async (i: sdk.IntegrationDefinition): Promise<types.IntegrationDefinition> => {
    return {
      id: null,
      name: i.name,
      version: i.version,
      user: {
        tags: i.user?.tags ?? {},
        creation: i.user?.creation ?? { enabled: false, requiredTags: [] },
      },
      configuration: i.configuration ? await _mapSchema(i.configuration) : { schema: {} },
      configurations: i.configurations ? await utils.records.mapValuesAsync(i.configurations, _mapSchema) : {},
      events: i.events ? await utils.records.mapValuesAsync(i.events, _mapSchema) : {},
      states: i.states ? await utils.records.mapValuesAsync(i.states, _mapSchema) : {},
      actions: i.actions
        ? await utils.records.mapValuesAsync(i.actions, async (a) => ({
            input: await _mapSchema(a.input),
            output: await _mapSchema(a.output),
          }))
        : {},
      channels: i.channels
        ? await utils.records.mapValuesAsync(i.channels, async (c) => ({
            conversation: {
              tags: c.conversation?.tags ?? {},
              creation: c.conversation?.creation ?? { enabled: false, requiredTags: [] },
            },
            message: {
              tags: c.message?.tags ?? {},
            },
            messages: await utils.records.mapValuesAsync(c.messages, _mapSchema),
          }))
        : {},
      entities: i.entities ? await utils.records.mapValuesAsync(i.entities, _mapSchema) : {},
    }
  }

  export const client = (i: client.Integration): types.IntegrationDefinition => {
    const { id, name, version, configuration, configurations, channels, states, events, actions, user, entities } = i
    return { id, name, version, configuration, configurations, channels, states, events, actions, user, entities }
  }

  const _mapSchema = async <T extends { schema: z.ZodObject<any> }>(
    x: T
  ): Promise<utils.types.Merge<T, { schema: Awaited<ReturnType<typeof utils.schema.mapZodToJsonSchema>> }>> => ({
    ...x,
    schema: await utils.schema.mapZodToJsonSchema(x),
  })
}
