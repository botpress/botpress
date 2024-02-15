import * as sdk from '@botpress/sdk'
import { ActionDefinition } from 'src/code-generation/typings'
import { z } from 'zod'
import * as errors from '../errors'
import * as utils from '../utils'
import { SdkActionDef, SdkEntityDef, SdkEntityEvent, SdkEntityOperation, SdkEventDef } from './typings'

const ID_SHAPE: z.ZodRawShape = { id: z.string() }

export const validateEntitiesSignature = (_i: sdk.IntegrationDefinition): void => {
  throw new errors.BotpressCLIError('Not implemented')
}

const _getEntitiesActionsSignatures = (
  entityName: string,
  entityDef: SdkEntityDef
): Record<SdkEntityOperation, ActionDefinition> => {
  const camelName = utils.casing.to.camelCase(entityName)

  const createAction = {
    input: {
      schema: entityDef.schema.partial(),
    },
    output: {
      schema: z.object({
        [camelName]: entityDef.schema.extend(ID_SHAPE),
      }),
    },
  }

  const readAction = {
    input: { schema: z.object(ID_SHAPE) },
    output: {
      schema: z.object({
        [camelName]: entityDef.schema.extend(ID_SHAPE),
      }),
    },
  }

  const updateAction = {
    input: {
      schema: entityDef.schema.partial().extend(ID_SHAPE),
    },
    output: {
      schema: z.object({
        [camelName]: entityDef.schema.extend(ID_SHAPE),
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
    output: { schema: z.object({ [camelName]: z.array(entityDef.schema.extend(ID_SHAPE)) }) },
  }

  return {
    create: createAction,
    read: readAction,
    update: updateAction,
    delete: deleteAction,
    list: listAction,
  }
}

const _getEntityEventSignature = (entityName: string, entityDef: SdkEntityDef): Record<SdkEntityEvent, SdkEventDef> => {
  const camelName = utils.casing.to.camelCase(entityName)

  const createdEvent = {
    schema: z.object({ [camelName]: entityDef.schema.extend(ID_SHAPE) }),
  }

  const updatedEvent = {
    schema: z.object({ [camelName]: entityDef.schema.extend(ID_SHAPE) }),
  }

  const deletedEvent = {
    schema: z.object({ [camelName]: entityDef.schema.extend(ID_SHAPE) }),
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
