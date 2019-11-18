import Joi from 'joi'

export const SlotsCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  // @deprecated >11
  entity: Joi.string().optional(),
  entities: Joi.array()
    .items(Joi.string())
    .required(),
  color: Joi.number().required(),
  id: Joi.string().required()
})

export const IntentDefCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
  utterances: Joi.object()
    .pattern(/.*/, Joi.array().items(Joi.string()))
    .default({}),
  slots: Joi.array()
    .items(SlotsCreateSchema)
    .default([]),
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global'])
})

const EntityDefOccurenceSchema = Joi.object().keys({
  name: Joi.string().required(),
  synonyms: Joi.array().items(Joi.string())
})

export const EntityDefCreateSchema = Joi.object().keys({
  id: Joi.string()
    .regex(/\t\s/gi, { invert: true })
    .required(),
  name: Joi.string().required(),
  type: Joi.string()
    .valid(['system', 'pattern', 'list'])
    .required(),
  sensitive: Joi.boolean(),
  fuzzy: Joi.number().default(0.8),
  matchCase: Joi.boolean(),
  examples: Joi.array()
    .items(Joi.string())
    .default([]),
  occurences: Joi.array()
    .items(EntityDefOccurenceSchema)
    .default([]),
  pattern: Joi.string().default('')
})
