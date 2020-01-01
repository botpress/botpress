import Joi from 'joi'

export const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
}

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
  fuzzy: Joi.number().default(FuzzyTolerance.Medium),
  matchCase: Joi.boolean(),
  examples: Joi.array()
    .items(Joi.string())
    .default([]),
  occurences: Joi.array()
    .items(EntityDefOccurenceSchema)
    .default([]),
  pattern: Joi.string().default('').allow('')
})
