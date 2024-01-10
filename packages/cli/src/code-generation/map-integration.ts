import * as bpclient from '@botpress/client'
import * as bpsdk from '@botpress/sdk'
import { z } from 'zod'
import * as utils from '../utils'
import * as types from './typings'

export namespace from {
  export const sdk = (i: bpsdk.IntegrationDefinition): types.IntegrationDefinition => ({
    id: null,
    name: i.name,
    version: i.version,
    user: {
      tags: i.user?.tags ?? {},
      creation: i.user?.creation ?? { enabled: false, requiredTags: [] },
    },
    configuration: i.configuration ? _mapSchema(i.configuration) : { schema: {} },
    events: i.events ? utils.records.mapValues(i.events, _mapSchema) : {},
    states: i.states ? utils.records.mapValues(i.states, _mapSchema) : {},
    actions: i.actions
      ? utils.records.mapValues(i.actions, (a) => ({
          input: _mapSchema(a.input),
          output: _mapSchema(a.output),
        }))
      : {},
    channels: i.channels
      ? utils.records.mapValues(i.channels, (c) => ({
          conversation: {
            tags: c.conversation?.tags ?? {},
            creation: c.conversation?.creation ?? { enabled: false, requiredTags: [] },
          },
          message: {
            tags: c.message?.tags ?? {},
          },
          messages: utils.records.mapValues(c.messages, _mapSchema),
        }))
      : {},
  })

  export const client = (i: bpclient.Integration): types.IntegrationDefinition => {
    const { id, name, version, configuration, channels, states, events, actions, user } = i
    return { id, name, version, configuration, channels, states, events, actions, user }
  }

  const _mapSchema = <T extends { schema: z.ZodObject<any> }>(
    x: T
  ): utils.types.Merge<T, { schema: ReturnType<typeof utils.schema.mapZodToJsonSchema> }> => ({
    ...x,
    schema: utils.schema.mapZodToJsonSchema(x),
  })
}
