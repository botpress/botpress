import Joi from 'joi'

export const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
}

const EntityDefOccurrenceSchema = Joi.object().keys({
  name: Joi.string().required(),
  synonyms: Joi.array().items(Joi.string())
})

export const EntityDefCreateSchema = Joi.object().keys({
  id: Joi.string().regex(/\t\s/gi, { invert: true }),
  name: Joi.string().required(),
  type: Joi.string()
    .valid(['system', 'pattern', 'list'])
    .required(),
  sensitive: Joi.boolean().default(false),
  fuzzy: Joi.number().default(FuzzyTolerance.Medium),
  matchCase: Joi.boolean(),
  examples: Joi.array()
    .items(Joi.string())
    .default([]),
  occurrences: Joi.array()
    .items(EntityDefOccurrenceSchema)
    .default([]),
  pattern: Joi.string()
    .default('')
    .allow('')
})

export const SlotsCreateSchema = Joi.object().keys({
  name: Joi.string().required(),
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
