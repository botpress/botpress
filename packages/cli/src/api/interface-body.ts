import type { Client, Interface } from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import { AnyZodObject, GenericZuiSchema, z } from '@botpress/sdk'
import * as utils from '../utils'

export type CreateInterfaceBody = Parameters<Client['createInterface']>[0]
export type UpdateInterfaceBody = Parameters<Client['updateInterface']>[0]

export const prepareCreateInterfaceBody = async (intrface: sdk.InterfaceDeclaration): Promise<CreateInterfaceBody> => ({
  name: intrface.name,
  version: intrface.version,
  entities: intrface.entities
    ? await utils.records.mapValuesAsync(intrface.entities, async (entity) => ({
        ...entity,
        schema: await utils.schema.mapZodToJsonSchema(entity),
      }))
    : {},
  events: intrface.events
    ? await utils.records.mapValuesAsync(intrface.events, async (event) => ({
        ...event,
        schema: await utils.schema.mapZodToJsonSchema(_dereference(intrface, event)),
      }))
    : {},
  actions: intrface.actions
    ? await utils.records.mapValuesAsync(intrface.actions, async (action) => ({
        ...action,
        input: {
          ...action.input,
          schema: await utils.schema.mapZodToJsonSchema(_dereference(intrface, action.input)),
        },
        output: {
          ...action.output,
          schema: await utils.schema.mapZodToJsonSchema(_dereference(intrface, action.output)),
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

const _dereference = (
  intrface: sdk.InterfaceDeclaration,
  { schema }: { schema: GenericZuiSchema<Record<string, z.ZodRef>, AnyZodObject> }
): { schema: AnyZodObject } => {
  const typeArguments = utils.records.mapValues(intrface.entities, (_, entityName) => z.ref(entityName))
  return { schema: schema(typeArguments) }
}
