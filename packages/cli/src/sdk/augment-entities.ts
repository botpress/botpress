import type * as bpsdk from '@botpress/sdk'
import { z } from 'zod'
import * as errors from '../errors'
import * as utils from '../utils'
import { SdkActionDef, SdkEntityDef, SdkEventDef } from './typings'

export const augmentIntegrationDefinition = async (
  integrationDef: bpsdk.IntegrationDefinition
): Promise<bpsdk.IntegrationDefinition> => {
  const { entities } = integrationDef
  if (!entities) {
    return integrationDef
  }

  const actions: Record<string, SdkActionDef> = utils.records.mapKeys(integrationDef.actions ?? {}, (actionName) =>
    utils.casing.to.camelCase(actionName)
  )

  for (const [entityName, entityDef] of Object.entries(entities)) {
    const entitiesActions = _getEntityActions(entityName, entityDef)
    for (const [actionName, actionDef] of Object.entries(entitiesActions)) {
      const alreadyDefined = entitiesActions[actionName]
      if (alreadyDefined) {
        const isValid = await _actionExtends(alreadyDefined, actionDef)
        if (!isValid) {
          throw new errors.BotpressCLIError(
            `Action "${actionName}" is defined in integration, but does not extend the required entity schema`
          )
        }
      }
      actions[actionName] = actionDef
    }
  }

  const events: Record<string, SdkEventDef> = utils.records.mapKeys(integrationDef.events ?? {}, (eventName) =>
    utils.casing.to.camelCase(eventName)
  )

  for (const [entityName, entityDef] of Object.entries(entities)) {
    const entitiesEvents = _getEntityEvents(entityName, entityDef)
    for (const [eventName, eventDef] of Object.entries(entitiesEvents)) {
      const alreadyDefined = events[eventName]
      if (alreadyDefined) {
        const isValid = await _eventExtends(alreadyDefined, eventDef)
        if (!isValid) {
          throw new errors.BotpressCLIError(
            `Event "${eventName}" is defined in integration, but does not extend the required entity schema`
          )
        }
      }
      events[eventName] = eventDef
    }
  }

  return {
    ...integrationDef,
    actions,
    events,
  }
}

const _getEntityActions = (entityName: string, entityDef: SdkEntityDef): Record<string, SdkActionDef> => {
  const pascalName = utils.casing.to.pascalCase(entityName)
  const camelName = utils.casing.to.camelCase(entityName)
  const { schema } = entityDef
  const id: z.ZodRawShape = { id: z.string() }

  const actions: Record<string, SdkActionDef> = {}

  if (entityDef.operations?.create) {
    actions[`create${pascalName}`] = {
      input: {
        schema: z.object({
          [camelName]: schema,
        }),
      },
      output: {
        schema: z.object({
          [camelName]: schema.extend(id),
        }),
      },
    }
  }

  if (entityDef.operations?.read) {
    actions[`read${pascalName}`] = {
      input: { schema: z.object(id) },
      output: {
        schema: z.object({
          [camelName]: schema.extend(id),
        }),
      },
    }
  }

  if (entityDef.operations?.update) {
    actions[`update${pascalName}`] = {
      input: {
        schema: z.object({
          [camelName]: schema.extend(id),
        }),
      },
      output: {
        schema: z.object({
          [camelName]: schema.extend(id),
        }),
      },
    }
  }

  if (entityDef.operations?.delete) {
    actions[`delete${pascalName}`] = {
      input: { schema: z.object(id) },
      output: { schema: z.object({}) },
    }
  }

  if (entityDef.operations?.list) {
    // TODO: use plural form of entity name
    actions[`list${pascalName}`] = {
      input: { schema: z.object({}) },
      output: { schema: z.object({ [camelName]: z.array(schema.extend(id)) }) },
    }
  }

  return actions
}

const _getEntityEvents = (entityName: string, entityDef: SdkEntityDef): Record<string, SdkEventDef> => {
  const camelName = utils.casing.to.camelCase(entityName)
  const { schema } = entityDef
  const events: Record<string, SdkEventDef> = {}
  if (entityDef.notification?.created) {
    events[`${camelName}Created`] = { schema: schema.extend({ id: z.string() }) }
  }
  if (entityDef.notification?.updated) {
    events[`${camelName}Updated`] = { schema: schema.extend({ id: z.string() }) }
  }
  if (entityDef.notification?.deleted) {
    events[`${camelName}Deleted`] = { schema: schema.extend({ id: z.string() }) }
  }
  return events
}

const _actionExtends = async (child: SdkActionDef, parent: SdkActionDef): Promise<boolean> => {
  // child function is not forced to use all input fields from parent
  const inputExtends = await utils.schema.zodExtends(parent.input.schema, child.input.schema)

  // child function can return more fields than parent
  const outputExtends = await utils.schema.zodExtends(child.output.schema, parent.output.schema)

  return inputExtends && outputExtends
}

const _eventExtends = async (child: SdkEventDef, parent: SdkEventDef): Promise<boolean> => {
  // child event can have more fields than parent
  return await utils.schema.zodExtends(child.schema, parent.schema)
}
