import { NLU } from 'botpress/sdk'
import Joi, { validate } from 'joi'
import _ from 'lodash'

import { LegacyIntentDefinition } from '../typings'

const GLOBAL_CTX = 'global'

export const LegacySlotsCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  entities: Joi.array()
    .items(Joi.string())
    .required(),
  color: Joi.number().required(),
  id: Joi.string().required()
})

export const LegacyIntentDefCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  utterances: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({}),
  slots: Joi.array()
    .items(LegacySlotsCreateSchema)
    .default([]),
  contexts: Joi.array()
    .items(Joi.string())
    .default([GLOBAL_CTX])
})

export async function validateLegacyIntent(intent: any, availableEntities: NLU.EntityDefinition[]) {
  const intentDef: LegacyIntentDefinition = await validate(intent, LegacyIntentDefCreateSchema, {
    stripUnknown: true
  })

  if (!intentDef.contexts.length) {
    intentDef.contexts.push(GLOBAL_CTX)
  }

  _(intentDef.slots)
    .flatMap(s => s.entities)
    .uniq()
    .forEach(entity => {
      if (!availableEntities.find(e => e.name === entity)) {
        throw Error(`"${entity}" is neither a system entity nor a custom entity`)
      }
    })

  return intentDef
}
