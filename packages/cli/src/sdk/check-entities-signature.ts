import * as sdk from '@botpress/sdk'
import { AnyZodObject, z } from 'zod'
import * as errors from '../errors'
import * as utils from '../utils'
import { SdkActionDef, SdkEntityDef, SdkEntityEvent, SdkEntityOperation, SdkEventDef } from './typings'

const ID_SHAPE: z.ZodRawShape = { id: z.string() }

export const validateEntitiesSignature = async (_i: sdk.IntegrationDefinition): Promise<void> => {
  for (const [entityName, entityDef] of Object.entries(_i.entities ?? {})) {
    const actionsSignatures = _getEntitiesActionsSignatures(entityDef)
    const eventSignatures = _getEntityEventSignature(entityDef)

    const actions = _i.actions ?? {}

    for (const [operationName, actionName] of Object.entries(entityDef.actions ?? {})) {
      const actionDef = actions[actionName]
      if (!actionDef) {
        throw new errors.BotpressCLIError(`Action "${actionName}" not found for entity "${entityName}"`)
      }

      const actionSignature = actionsSignatures[operationName as SdkEntityOperation]
      await _checkActionExtends(actionDef, actionSignature).catch((err) => {
        throw errors.BotpressCLIError.wrap(
          err,
          `Action "${actionName}" does not match the required signature for operation "${operationName}" or entity "${entityName}"`
        )
      })
    }

    const events = _i.events ?? {}

    for (const [notificationName, eventName] of Object.entries(entityDef.events ?? {})) {
      const eventDef = events[eventName]
      if (!eventDef) {
        throw new errors.BotpressCLIError(`Event "${eventName}" not found for entity "${entityName}"`)
      }

      const eventSignature = eventSignatures[notificationName as SdkEntityEvent]
      await _checkEventExtends(eventDef, eventSignature).catch((err) => {
        throw errors.BotpressCLIError.wrap(
          err,
          `Event "${eventName}" does not match the required signature for notification "${notificationName}" or entity "${entityName}"`
        )
      })
    }
  }
}

const _getEntitiesActionsSignatures = (entityDef: SdkEntityDef): Record<SdkEntityOperation, SdkActionDef> => {
  const anyObject = z.any() as any as AnyZodObject // action input should be an object, but record is fine here for checking extension

  const createAction = {
    input: {
      schema: anyObject,
    },
    output: {
      schema: z.object({
        data: entityDef.schema.extend(ID_SHAPE),
      }),
    },
  }

  const readAction = {
    input: { schema: z.object(ID_SHAPE) },
    output: {
      schema: z.object({
        data: entityDef.schema.extend(ID_SHAPE),
      }),
    },
  }

  const updateAction = {
    input: {
      schema: anyObject,
    },
    output: {
      schema: z.object({
        data: entityDef.schema.extend(ID_SHAPE),
      }),
    },
  }

  const deleteAction = {
    input: { schema: z.object(ID_SHAPE) },
    output: { schema: z.object({}) },
  }

  // TODO: use plural of camelName
  const listAction = {
    input: { schema: z.object({}) },
    output: { schema: z.object({ data: z.array(entityDef.schema.extend(ID_SHAPE)) }) },
  }

  return {
    create: createAction,
    read: readAction,
    update: updateAction,
    delete: deleteAction,
    list: listAction,
  }
}

const _getEntityEventSignature = (entityDef: SdkEntityDef): Record<SdkEntityEvent, SdkEventDef> => {
  const createdEvent = {
    schema: z.object({ data: entityDef.schema.extend(ID_SHAPE) }),
  }

  const updatedEvent = {
    schema: z.object({ data: entityDef.schema.extend(ID_SHAPE) }),
  }

  const deletedEvent = {
    schema: z.object({ data: entityDef.schema.extend(ID_SHAPE) }),
  }

  return {
    created: createdEvent,
    updated: updatedEvent,
    deleted: deletedEvent,
  }
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
