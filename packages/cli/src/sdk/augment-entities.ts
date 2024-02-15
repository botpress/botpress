import type * as bpsdk from '@botpress/sdk'
import { z } from 'zod'
import * as errors from '../errors'
import * as utils from '../utils'
import { SdkActionDef, SdkEntityDef, SdkEventDef } from './typings'

const ID_SHAPE: z.ZodRawShape = { id: z.string() }

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
      const alreadyDefined = actions[actionName]
      if (alreadyDefined) {
        await _checkActionExtends(alreadyDefined, actionDef)
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
        await _checkEventExtends(alreadyDefined, eventDef)
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

  const actions: Record<string, SdkActionDef> = {}

  if (entityDef.actions?.create) {
    const actionName = entityDef.actions.create.name ?? `create${pascalName}`
    const outputKey = entityDef.actions.create.ouputKey ?? camelName
    const inputSchema = entityDef.actions.create.input?.schema ?? entityDef.schema
    actions[actionName] = {
      input: {
        schema: inputSchema,
      },
      output: {
        schema: z.object({
          [outputKey]: entityDef.schema.extend(ID_SHAPE),
        }),
      },
    }
  }

  if (entityDef.actions?.read) {
    const actionName = entityDef.actions.read.name ?? `read${pascalName}`
    const outputKey = entityDef.actions.read.ouputKey ?? camelName
    actions[actionName] = {
      input: { schema: z.object(ID_SHAPE) },
      output: {
        schema: z.object({
          [outputKey]: entityDef.schema.extend(ID_SHAPE),
        }),
      },
    }
  }

  if (entityDef.actions?.update) {
    const actionName = entityDef.actions.update.name ?? `update${pascalName}`
    const outputKey = entityDef.actions.update.ouputKey ?? camelName
    const inputSchema = entityDef.actions.update.input?.schema ?? entityDef.schema
    actions[actionName] = {
      input: {
        schema: inputSchema.extend(ID_SHAPE),
      },
      output: {
        schema: z.object({
          [outputKey]: entityDef.schema.extend(ID_SHAPE),
        }),
      },
    }
  }

  if (entityDef.actions?.delete) {
    const actionName = entityDef.actions.delete.name ?? `delete${pascalName}`
    actions[actionName] = {
      input: { schema: z.object(ID_SHAPE) },
      output: { schema: z.object({}) },
    }
  }

  if (entityDef.actions?.list) {
    const actionName = entityDef.actions.list.name ?? `list${pascalName}`
    const outputKey = entityDef.actions.list.ouputKey ?? camelName
    actions[actionName] = {
      input: { schema: z.object({}) },
      output: { schema: z.object({ [outputKey]: z.array(entityDef.schema.extend(ID_SHAPE)) }) },
    }
  }

  return actions
}

const _getEntityEvents = (entityName: string, entityDef: SdkEntityDef): Record<string, SdkEventDef> => {
  const camelName = utils.casing.to.camelCase(entityName)
  const events: Record<string, SdkEventDef> = {}
  if (entityDef.events?.created) {
    const eventName = entityDef.events.created.name ?? `${camelName}Created`
    events[eventName] = { schema: entityDef.schema.extend(ID_SHAPE) }
  }
  if (entityDef.events?.updated) {
    const eventName = entityDef.events.updated.name ?? `${camelName}Updated`
    events[eventName] = { schema: entityDef.schema.extend(ID_SHAPE) }
  }
  if (entityDef.events?.deleted) {
    const eventName = entityDef.events.deleted.name ?? `${camelName}Deleted`
    events[eventName] = { schema: z.object(ID_SHAPE) }
  }
  return events
}

const _checkActionExtends = async (child: SdkActionDef, parent: SdkActionDef): Promise<void> => {
  // child function is not forced to use all input fields from parent
  const inputExtends = await utils.schema.zodExtends(parent.input.schema, child.input.schema)
  if (!inputExtends.extends) {
    const reason = inputExtends.reasons.join('\n')
    throw new errors.BotpressCLIError(`Action input schema does not extend the required entity schema:\n${reason}`)
  }

  // child function can return more fields than parent
  const outputExtends = await utils.schema.zodExtends(child.output.schema, parent.output.schema)
  if (!outputExtends.extends) {
    const reason = outputExtends.reasons.join('\n')
    throw new errors.BotpressCLIError(`Action output schema does not extend the required entity schema:\n${reason}`)
  }
}

const _checkEventExtends = async (child: SdkEventDef, parent: SdkEventDef): Promise<void> => {
  // child event can have more fields than parent
  const eventExtends = await utils.schema.zodExtends(child.schema, parent.schema)
  if (!eventExtends.extends) {
    const reason = eventExtends.reasons.join('\n')
    throw new errors.BotpressCLIError(`Event schema does not extend the required entity schema:\n${reason}`)
  }
}
