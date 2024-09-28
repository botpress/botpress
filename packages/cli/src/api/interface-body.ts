import type { Client, Interface } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import * as utils from '../utils'

export type CreateInterfaceBody = Parameters<Client['createInterface']>[0]
export type UpdateInterfaceBody = Parameters<Client['updateInterface']>[0]

export const prepareCreateInterfaceBody = (intrface: sdk.InterfaceDeclaration): CreateInterfaceBody => ({
  name: intrface.name,
  version: intrface.version,
  entities: intrface.entities
    ? utils.records.mapValues(intrface.entities, (entity) => ({
        ...entity,
        schema: utils.schema.mapZodToJsonSchema(entity),
      }))
    : {},
  events: intrface.events
    ? utils.records.mapValues(intrface.events, (event) => ({
        ...event,
        schema: utils.schema.mapZodToJsonSchema(event),
      }))
    : {},
  actions: intrface.actions
    ? utils.records.mapValues(intrface.actions, (action) => ({
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
    : {},
})

export const prepareUpdateInterfaceBody = (
  localInterface: UpdateInterfaceBody,
  remoteInterface: Interface
): UpdateInterfaceBody => {
  const actions = utils.records.setNullOnMissingValues(localInterface.actions, remoteInterface.actions)
  const events = utils.records.setNullOnMissingValues(localInterface.events, remoteInterface.events)
  const entities = utils.records.setNullOnMissingValues(localInterface.entities, remoteInterface.entities)
  return {
    ...localInterface,
    entities,
    actions,
    events,
  }
}
